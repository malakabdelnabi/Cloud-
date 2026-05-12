const { randomUUID } = require('crypto');
const path = require('path');
const supabase = require('../config/supabase');

const BUCKET = 'tickets-images';

/**
 * Helper: build a signed URL that works for ~1 hour.
 */
async function signedUrl(imagePath) {
  if (!imagePath) return null;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(imagePath, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}

/**
 * @desc    Get tickets based on user role
 * @route   GET /api/tickets
 */
exports.getTickets = async (req, res) => {
  try {
    const { role, userId } = req.user;
    let query = supabase.from('tickets').select('*');

    if (role === 'Community Member') {
      query = query.eq('reporter_id', userId);
    } else if (role === 'Worker') {
      query = query.eq('assigned_to', userId);
    }
    // Managers and Admins see all tickets

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const withUrls = await Promise.all(
      data.map(async (row) => ({
        ...row,
        image_url: await signedUrl(row.photo_path),
        completion_image_url: await signedUrl(row.completion_photo_path),
      }))
    );

    res.json({ tickets: withUrls });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching tickets' });
  }
};

/**
 * @desc    Get single ticket by ID
 * @route   GET /api/tickets/:id
 */
exports.getTicketById = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Ticket not found' });

    // Authorization check
    const { role, userId } = req.user;
    if (role === 'Community Member' && data.reporter_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    if (role === 'Worker' && data.assigned_to !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json({
      ticket: { 
        ...data, 
        image_url: await signedUrl(data.photo_path),
        completion_image_url: await signedUrl(data.completion_photo_path)
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching ticket' });
  }
};

/**
 * @desc    Create a new ticket
 * @route   POST /api/tickets
 */
exports.createTicket = async (req, res) => {
  const { location, category, description, priority } = req.body;
  const file = req.file;

  if (!location || !category || !description) {
    return res.status(400).json({ error: 'Location, category, and description are required' });
  }
  if (!file) return res.status(400).json({ error: 'Image file is required' });

  try {
    const ext = path.extname(file.originalname) || '.jpg';
    const imagePath = `${req.user.userId}/${randomUUID()}${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(imagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      return res.status(500).json({ error: uploadError.message });
    }

    const { data, error } = await supabase
      .from('tickets')
      .insert({
        reporter_id: req.user.userId,
        location,
        category,
        description,
        priority: priority || 'Medium',
        photo_path: imagePath,
        status: 'Pending'
      })
      .select('*')
      .single();

    if (error) {
      await supabase.storage.from(BUCKET).remove([imagePath]);
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({
      ticket: { ...data, image_url: await signedUrl(data.photo_path) },
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error creating ticket' });
  }
};

/**
 * @desc    Update ticket status
 * @route   PATCH /api/tickets/:id/status
 */
exports.updateTicketStatus = async (req, res) => {
  const { status, internal_notes } = req.body;
  const file = req.file; // Optional completion photo

  if (!status) return res.status(400).json({ error: 'Status is required' });

  try {
    let updateData = { status, updated_at: new Date() };
    if (internal_notes) updateData.internal_notes = internal_notes;

    if (file && status === 'Resolved') {
      const ext = path.extname(file.originalname) || '.jpg';
      const imagePath = `completion/${req.params.id}/${randomUUID()}${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(imagePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });
      
      if (!uploadError) {
        updateData.completion_photo_path = imagePath;
      }
    }

    const { data, error } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) return res.status(500).json({ error: error.message });

    res.json({ ticket: data });
  } catch (error) {
    res.status(500).json({ error: 'Server error updating ticket status' });
  }
};

/**
 * @desc    Assign ticket to a worker
 * @route   PATCH /api/tickets/:id/assign
 */
exports.assignTicket = async (req, res) => {
  const { worker_id } = req.body;

  if (!worker_id) return res.status(400).json({ error: 'Worker ID is required' });

  try {
    const { data, error } = await supabase
      .from('tickets')
      .update({ 
        assigned_to: worker_id, 
        status: 'In Progress',
        updated_at: new Date() 
      })
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) return res.status(500).json({ error: error.message });

    res.json({ ticket: data });
  } catch (error) {
    res.status(500).json({ error: 'Server error assigning ticket' });
  }
};

/**
 * @desc    Delete a ticket
 * @route   DELETE /api/tickets/:id
 */
exports.deleteTicket = async (req, res) => {
  try {
    const { data: row, error: findError } = await supabase
      .from('tickets')
      .select('id, photo_path, completion_photo_path')
      .eq('id', req.params.id)
      .single();

    if (findError || !row) return res.status(404).json({ error: 'Ticket not found' });

    const { error: deleteRowError } = await supabase
      .from('tickets')
      .delete()
      .eq('id', row.id);

    if (deleteRowError) {
      return res.status(500).json({ error: deleteRowError.message });
    }

    // Delete images from storage
    const filesToDelete = [];
    if (row.photo_path) filesToDelete.push(row.photo_path);
    if (row.completion_photo_path) filesToDelete.push(row.completion_photo_path);
    
    if (filesToDelete.length > 0) {
      await supabase.storage.from(BUCKET).remove(filesToDelete);
    }

    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Server error deleting ticket' });
  }
};

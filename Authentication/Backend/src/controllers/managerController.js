    const supabase = require('../config/supabase');

const BUCKET = 'ticket-images';

/**
 * Helper: build a signed URL valid for ~1 hour.
 */
async function signedUrl(imagePath) {
  if (!imagePath) return null;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(imagePath, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}

// ─────────────────────────────────────────────
// TICKET MANAGEMENT
// ─────────────────────────────────────────────

/**
 * @desc  Get ALL tickets (with optional filters)
 * @route GET /api/manager/tickets
 * @query status, category, priority, assigned_to
 */
exports.getAllTickets = async (req, res) => {
  try {
    const { status, category, priority, assigned_to } = req.query;

    let query = supabase.from('tickets').select('*');

    if (status)      query = query.eq('status', status);
    if (category)    query = query.eq('category', category);
    if (priority)    query = query.eq('priority', priority);
    if (assigned_to) query = query.eq('assigned_to', assigned_to);

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
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching tickets' });
  }
};

/**
 * @desc  Get a single ticket by ID (full details)
 * @route GET /api/manager/tickets/:id
 */
exports.getTicketById = async (req, res) => {
  try {
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !ticket) return res.status(404).json({ error: 'Ticket not found' });

    // Fetch reporter info
    const { data: reporter } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', ticket.reporter_id)
      .single();

    // Fetch assigned worker info (if any)
    let worker = null;
    if (ticket.assigned_to) {
      const { data: w } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', ticket.assigned_to)
        .single();
      worker = w;
    }

    // Fetch comments
    const { data: comments } = await supabase
      .from('ticket_comments')
      .select('*')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true });

    res.json({
      ticket: {
        ...ticket,
        image_url: await signedUrl(ticket.photo_path),
        completion_image_url: await signedUrl(ticket.completion_photo_path),
        reporter,
        worker,
        comments: comments || [],
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching ticket' });
  }
};

/**
 * @desc  Update ticket status and/or internal notes
 * @route PATCH /api/manager/tickets/:id/status
 * @body  { status, internal_notes }
 */
exports.updateTicketStatus = async (req, res) => {
  const { status, internal_notes } = req.body;

  const validStatuses = ['Pending', 'In Progress', 'Resolved'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    const updateData = { status, updated_at: new Date() };
    if (internal_notes !== undefined) updateData.internal_notes = internal_notes;

    const { data, error } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data)  return res.status(404).json({ error: 'Ticket not found' });

    res.json({ ticket: data });
  } catch (err) {
    res.status(500).json({ error: 'Server error updating ticket status' });
  }
};

/**
 * @desc  Set / update ticket priority
 * @route PATCH /api/manager/tickets/:id/priority
 * @body  { priority }
 */
exports.updateTicketPriority = async (req, res) => {
  const { priority } = req.body;
  const validPriorities = ['Low', 'Medium', 'High', 'Urgent'];

  if (!priority || !validPriorities.includes(priority)) {
    return res.status(400).json({ error: `Priority must be one of: ${validPriorities.join(', ')}` });
  }

  try {
    const { data, error } = await supabase
      .from('tickets')
      .update({ priority, updated_at: new Date() })
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data)  return res.status(404).json({ error: 'Ticket not found' });

    res.json({ ticket: data });
  } catch (err) {
    res.status(500).json({ error: 'Server error updating priority' });
  }
};

/**
 * @desc  Assign ticket to a worker
 * @route PATCH /api/manager/tickets/:id/assign
 * @body  { worker_id }
 */
exports.assignTicket = async (req, res) => {
  const { worker_id } = req.body;
  if (!worker_id) return res.status(400).json({ error: 'worker_id is required' });

  try {
    // Verify the target user exists and is a Worker
    const { data: worker, error: workerError } = await supabase
      .from('users')
      .select('id, name, role, is_active')
      .eq('id', worker_id)
      .single();

    if (workerError || !worker) return res.status(404).json({ error: 'Worker not found' });
    if (worker.role !== 'Worker')  return res.status(400).json({ error: 'Target user is not a Worker' });
    if (!worker.is_active)         return res.status(400).json({ error: 'Worker account is inactive' });

    const { data, error } = await supabase
      .from('tickets')
      .update({
        assigned_to: worker_id,
        status: 'In Progress',
        updated_at: new Date(),
      })
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data)  return res.status(404).json({ error: 'Ticket not found' });

    res.json({ ticket: data, assigned_worker: { id: worker.id, name: worker.name } });
  } catch (err) {
    res.status(500).json({ error: 'Server error assigning ticket' });
  }
};

/**
 * @desc  Close (resolve) a ticket
 * @route PATCH /api/manager/tickets/:id/close
 * @body  { internal_notes? }
 */
exports.closeTicket = async (req, res) => {
  const { internal_notes } = req.body;

  try {
    const updateData = { status: 'Resolved', updated_at: new Date() };
    if (internal_notes) updateData.internal_notes = internal_notes;

    const { data, error } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data)  return res.status(404).json({ error: 'Ticket not found' });

    res.json({ ticket: data });
  } catch (err) {
    res.status(500).json({ error: 'Server error closing ticket' });
  }
};

/**
 * @desc  Add an internal note to a ticket (not visible to Community Members)
 * @route PATCH /api/manager/tickets/:id/notes
 * @body  { internal_notes }
 */
exports.addInternalNote = async (req, res) => {
  const { internal_notes } = req.body;
  if (!internal_notes) return res.status(400).json({ error: 'internal_notes is required' });

  try {
    const { data, error } = await supabase
      .from('tickets')
      .update({ internal_notes, updated_at: new Date() })
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data)  return res.status(404).json({ error: 'Ticket not found' });

    res.json({ ticket: data });
  } catch (err) {
    res.status(500).json({ error: 'Server error adding note' });
  }
};

// ─────────────────────────────────────────────
// WORKER MANAGEMENT
// ─────────────────────────────────────────────

/**
 * @desc  Get all workers (for the assign-ticket dropdown)
 * @route GET /api/manager/workers
 */
exports.getWorkers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, is_active')
      .eq('role', 'Worker')
      .order('name', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    res.json({ workers: data });
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching workers' });
  }
};

    

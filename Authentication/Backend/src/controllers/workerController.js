const { randomUUID } = require('crypto');
const path = require('path');
const supabase = require('../config/supabase');
const BUCKET = 'ticket-images';

async function signedUrl(imagePath) {
  if (!imagePath) return null;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(imagePath, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}

exports.getMyTickets = async (req, res) => {
  try {
    const { userId } = req.user;
    const { data, error } = await supabase.from('tickets').select('*').eq('assigned_to', userId).order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    const withUrls = await Promise.all(data.map(async (row) => ({ ...row, image_url: await signedUrl(row.photo_path), completion_image_url: await signedUrl(row.completion_photo_path) })));
    res.json({ tickets: withUrls });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching assigned tickets' });
  }
};

exports.getMyTicketById = async (req, res) => {
  try {
    const { userId } = req.user;
    const { data, error } = await supabase.from('tickets').select('*').eq('id', req.params.id).eq('assigned_to', userId).single();
    if (error || !data) return res.status(404).json({ error: 'Ticket not found or not assigned to you' });
    res.json({ ticket: { ...data, image_url: await signedUrl(data.photo_path), completion_image_url: await signedUrl(data.completion_photo_path) } });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching ticket' });
  }
};

exports.markInProgress = async (req, res) => {
  try {
    const { userId } = req.user;
    const { data: ticket, error: findError } = await supabase.from('tickets').select('*').eq('id', req.params.id).eq('assigned_to', userId).single();
    if (findError || !ticket) return res.status(404).json({ error: 'Ticket not found or not assigned to you' });
    const { data, error } = await supabase.from('tickets').update({ status: 'In Progress', updated_at: new Date() }).eq('id', req.params.id).select('*').single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Ticket marked as In Progress', ticket: data });
  } catch (error) {
    res.status(500).json({ error: 'Server error updating ticket status' });
  }
};

exports.addComment = async (req, res) => {
  const { comment } = req.body;
  if (!comment) return res.status(400).json({ error: 'Comment text is required' });
  try {
    const { userId } = req.user;
    const { data: ticket, error: findError } = await supabase.from('tickets').select('*').eq('id', req.params.id).eq('assigned_to', userId).single();
    if (findError || !ticket) return res.status(404).json({ error: 'Ticket not found or not assigned to you' });
    const { data, error } = await supabase.from('comments').insert({ ticket_id: req.params.id, worker_id: userId, comment, created_at: new Date() }).select('*').single();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ message: 'Comment added successfully', comment: data });
  } catch (error) {
    res.status(500).json({ error: 'Server error adding comment' });
  }
};

exports.uploadCompletionPhoto = async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'Completion photo is required' });
  try {
    const { userId } = req.user;
    const { data: ticket, error: findError } = await supabase.from('tickets').select('*').eq('id', req.params.id).eq('assigned_to', userId).single();
    if (findError || !ticket) return res.status(404).json({ error: 'Ticket not found or not assigned to you' });
    const ext = path.extname(file.originalname) || '.jpg';
    const imagePath = `completion/${req.params.id}/${randomUUID()}${ext}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(imagePath, file.buffer, { contentType: file.mimetype, upsert: false });
    if (uploadError) return res.status(500).json({ error: uploadError.message });
    const { data, error } = await supabase.from('tickets').update({ completion_photo_path: imagePath, status: 'Resolved', updated_at: new Date() }).eq('id', req.params.id).select('*').single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Completion photo uploaded and ticket marked as Resolved', ticket: { ...data, completion_image_url: await signedUrl(imagePath) } });
  } catch (error) {
    res.status(500).json({ error: 'Server error uploading completion photo' });
  }
};
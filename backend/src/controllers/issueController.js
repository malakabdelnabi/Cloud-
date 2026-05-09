const supabase = require('../config/supabaseClient');

// POST /api/issues - Submit a new issue
const submitIssue = async (req, res) => {
  try {
    const { title, description, category, location } = req.body;
    const user_id = req.user.userId;
    let photo_url = null;

    // Handle photo upload to Supabase Storage
    if (req.file) {
      const file = req.file;
      const fileName = `${user_id}/${Date.now()}_${file.originalname}`;

      const { data, error: uploadError } = await supabase.storage
        .from('issue-photos')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('issue-photos')
        .getPublicUrl(fileName);

      photo_url = publicUrlData.publicUrl;
    }

    // Insert issue into database
    const { data, error } = await supabase
      .from('issues')
      .insert([{ user_id, title, description, category, location, photo_url }])
      .select();

    if (error) throw error;

    res.status(201).json({
      message: 'Issue submitted successfully',
      issue: data[0],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/issues - Get all issues for the logged-in user
const getMyIssues = async (req, res) => {
  try {
    const user_id = req.user.userId;

    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({ issues: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/issues/:id - Get a single issue with its status
const getIssueById = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.userId;

    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .eq('id', id)
      .eq('user_id', user_id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Issue not found' });

    res.status(200).json({ issue: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { submitIssue, getMyIssues, getIssueById };
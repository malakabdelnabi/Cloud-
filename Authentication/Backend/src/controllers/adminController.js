const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const getAllUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json({ users: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  if (typeof is_active !== 'boolean') {
    return res.status(400).json({ error: 'is_active must be true or false' });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .update({ is_active, updated_at: new Date() })
      .eq('id', id)
      .select('id, name, email, role, is_active');

    if (error) throw error;
    if (!data.length) return res.status(404).json({ error: 'User not found' });

    res.status(200).json({ message: 'User status updated', user: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAllUsers, updateUserStatus };

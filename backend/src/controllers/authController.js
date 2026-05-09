const { generateToken, hashPassword, comparePassword } = require('../config/JWT');
const supabase = require('../config/supabase');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 */
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required' });
  }

  // Validate role
  const allowedRoles = ['Community Member', 'Facility Manager', 'Worker', 'Admin'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    // 1. Check if user already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // 2. Hash the password
    const hashedPassword = await hashPassword(password);

    // 3. Create user in Supabase 'users' table
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{ name, email, password: hashedPassword, role }])
      .select()
      .single();

    if (insertError) throw insertError;

    // 4. Generate token
    const token = generateToken({ 
      userId: newUser.id, 
      email: newUser.email,
      role: newUser.role 
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // 1. Find user by email
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (fetchError || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 2. Compare password
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 3. Generate token
    const token = generateToken({ 
      userId: user.id, 
      email: user.email,
      role: user.role 
    });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Server error during login' });
  }
};

/**
 * @desc    Logout user / Invalidate token
 * @route   POST /api/auth/logout
 */
exports.logout = async (req, res) => {
  // In a JWT setup, logout is typically handled by the client deleting the token.
  // Optionally, you can implement a token blacklist.
  res.json({ message: 'Logout successful' });
};

/**
 * @desc    Forgot password request
 * @route   POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    // 1. Check if user exists
    const { data: user, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (!user) {
      // For security, don't reveal if user exists
      return res.json({ message: 'If an account exists with that email, a reset link has been sent.' });
    }

    // 2. Logic to send email would go here (e.g., using SendGrid, Nodemailer)
    // For now, we'll just return success.
    res.json({ message: 'Password reset instructions sent to your email.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * @desc    Reset password
 * @route   POST /api/auth/reset-password
 */
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }
  // Implement reset logic (verify reset token, update password in DB)
  res.json({ message: 'Password has been reset successfully.' });
};

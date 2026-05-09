const { verifyToken } = require('../config/JWT');
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // This will contain whatever payload was signed (e.g., userId)
    req.accessToken = token;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = requireAuth;

/**
 * Middleware to restrict access based on user roles.
 * @param {...string} allowedRoles - The roles permitted to access the route.
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: 'Unauthorized: No role assigned' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Forbidden: Access restricted to [${allowedRoles.join(', ')}] roles` 
      });
    }

    next();
  };
};

module.exports = authorize;

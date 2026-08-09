const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ status: 'error', message: 'Access forbidden: Role undefined' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        status: 'error', 
        message: `Forbidden: Requires one of [${allowedRoles.join(', ')}] permissions` 
      });
    }

    next();
  };
};

module.exports = { requireRole };
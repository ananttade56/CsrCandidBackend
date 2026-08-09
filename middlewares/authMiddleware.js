const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(403).json({ message: 'A token is required for authentication' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded;
  } catch (err) {
    return res.status(401).json({ message: 'Invalid Token' });
  }
  return next();
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Role ${req.user.role} is not allowed to access this resource` });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  authorizeRoles,
};

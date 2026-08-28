const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { UnauthorizedError, ForbiddenError } = require('../errors/AppError');

// Hash Password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(password, salt);
};

// Verify Password
const comparePasswords = async (candidatePassword, hashedPassword) => {
  return await bcrypt.compare(candidatePassword, hashedPassword);
};

// JWT Verification Middleware
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or invalid authorization header'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded; // Contains user_id, role, etc.
    next();
  } catch (err) {
    return next(new UnauthorizedError('Token expired or invalid'));
  }
};

// Role Guard Middleware
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to perform this action'));
    }
    next();
  };
};

// Refresh Token Issue Helper
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { user_id: user.user_id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRATION }
  );

  const refreshToken = jwt.sign(
    { user_id: user.user_id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRATION }
  );

  return { accessToken, refreshToken };
};

module.exports = {
  hashPassword,
  comparePasswords,
  authenticateJWT,
  requireRole,
  generateTokens
};

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');
const { AuthenticationError } = require('../utils/errors');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Access denied. No token provided.');
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, config.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      throw new AuthenticationError('Invalid token. User not found.');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof AuthenticationError) {
      return next(err);
    }
    // jwt.verify throws JsonWebTokenError / TokenExpiredError
    next(new AuthenticationError('Invalid or expired token.'));
  }
};

module.exports = auth;

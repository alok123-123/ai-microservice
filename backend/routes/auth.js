const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const config = require('../config');
const { ValidationError, AuthenticationError } = require('../utils/errors');

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
const MAX_NAME_LENGTH = 100;

const generateToken = (user) => {
  return jwt.sign({ id: user._id }, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
};

/**
 * Sanitised user object for API responses.
 * Never exposes password hash or internal fields.
 */
function toUserResponse(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

// POST /register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      throw new ValidationError('Name, email, and password are required.');
    }

    if (typeof name !== 'string' || name.trim().length === 0 || name.length > MAX_NAME_LENGTH) {
      throw new ValidationError(`Name must be between 1 and ${MAX_NAME_LENGTH} characters.`);
    }

    if (!EMAIL_REGEX.test(email)) {
      throw new ValidationError('Please provide a valid email address.');
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new ValidationError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ValidationError('Email is already registered.');
    }

    const user = new User({ name: name.trim(), email, password });
    await user.save();

    const token = generateToken(user);

    res.status(201).json({
      token,
      user: toUserResponse(user),
    });
  } catch (err) {
    next(err);
  }
});

// POST /login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ValidationError('Email and password are required.');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new AuthenticationError('Invalid email or password.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AuthenticationError('Invalid email or password.');
    }

    const token = generateToken(user);

    res.json({
      token,
      user: toUserResponse(user),
    });
  } catch (err) {
    next(err);
  }
});

// GET /me (protected)
router.get('/me', auth, async (req, res, next) => {
  try {
    res.json({
      user: toUserResponse(req.user),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../db');
const { hashPassword, comparePasswords, generateTokens } = require('../middleware/auth');
const { AppError, UnauthorizedError } = require('../errors/AppError');

// Register User
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, role = 'traveler', full_name } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    // Normalize role to lowercase for consistent frontend route guards
    const normalizedRole = role.toLowerCase();

    const existing = await db.query('SELECT user_id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      throw new AppError('User already exists with this email', 400);
    }

    const passwordHash = await hashPassword(password);
    const result = await db.query(
      `INSERT INTO users (email, password_hash, role, full_name)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id, email, role, full_name`,
      [email, passwordHash, normalizedRole, full_name]
    );

    const user = result.rows[0];
    const tokens = generateTokens(user);

    res.status(201).json({ status: 'success', data: { user, ...tokens } });
  } catch (err) {
    next(err);
  }
});

// Login User
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const user = result.rows[0];
    const isValid = await comparePasswords(password, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokens = generateTokens(user);
    delete user.password_hash;

    res.status(200).json({ status: 'success', data: { user, ...tokens } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { generateTokens, comparePasswords } = require('../middleware/auth');[cite: 67]
const db = require('../config/db');[cite: 62]

// POST /api/v1/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !(await comparePasswords(password, user.password_hash))) {[cite: 67]
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const tokens = generateTokens(user);[cite: 67]
    return res.json({
      status: 'success',
      user: { user_id: user.user_id, role: user.role, email: user.email },
      ...tokens,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/refresh-token
router.post('/refresh-token', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);[cite: 61, 67]
    const tokens = generateTokens({ user_id: decoded.user_id, role: decoded.role });[cite: 67]

    return res.json({ accessToken: tokens.accessToken });
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired refresh token' });
  }
});

module.exports = router;

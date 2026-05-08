const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const requireAuth = require('../middleware/auth');

const SALT_ROUNDS = 12;
const TOKEN_TTL = '30d';

function makeToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.display_name },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  );
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }
  try {
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const displayName = (name && name.trim()) || email.split('@')[0];
    const result = await db.query(
      'INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, email, display_name',
      [email.toLowerCase(), hash, displayName]
    );
    const user = result.rows[0];
    res.json({ token: makeToken(user), user: { id: user.id, email: user.email, name: user.display_name } });
  } catch (e) {
    console.error('signup error', e);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid email or password.' });
    await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    res.json({ token: makeToken(user), user: { id: user.id, email: user.email, name: user.display_name } });
  } catch (e) {
    console.error('login error', e);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, display_name, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: { id: user.id, email: user.email, name: user.display_name, createdAt: user.created_at } });
  } catch (e) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;

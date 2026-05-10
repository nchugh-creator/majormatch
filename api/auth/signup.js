const bcrypt = require('bcryptjs');
const { getPool } = require('../_lib/db');
const { setCors, makeToken } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password, name } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

  try {
    const db = getPool();
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length) return res.status(409).json({ error: 'An account with this email already exists.' });

    const hash = await bcrypt.hash(password, 12);
    const displayName = (name && name.trim()) || email.split('@')[0];
    const result = await db.query(
      'INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, email, display_name',
      [email.toLowerCase(), hash, displayName]
    );
    const user = result.rows[0];
    res.json({ token: makeToken(user), user: { id: user.id, email: user.email, name: user.display_name } });
  } catch (e) {
    console.error('signup error', e.message);
    res.status(500).json({ error: e.message.includes('DATABASE_URL') ? e.message : 'Server error. Please try again.' });
  }
};

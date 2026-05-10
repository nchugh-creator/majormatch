const bcrypt = require('bcryptjs');
const { getPool } = require('../_lib/db');
const { setCors, makeToken } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

  try {
    const db = getPool();
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid email or password.' });

    await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    res.json({ token: makeToken(user), user: { id: user.id, email: user.email, name: user.display_name } });
  } catch (e) {
    console.error('login error', e.message);
    res.status(500).json({ error: e.message.includes('DATABASE_URL') ? e.message : 'Server error. Please try again.' });
  }
};

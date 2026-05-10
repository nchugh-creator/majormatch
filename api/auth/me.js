const { getPool } = require('../_lib/db');
const { setCors, requireAuth } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const user = requireAuth(req, res);
  if (!user) return;

  try {
    const db = getPool();
    const result = await db.query(
      'SELECT id, email, display_name, created_at FROM users WHERE id = $1',
      [user.id]
    );
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: { id: row.id, email: row.email, name: row.display_name, createdAt: row.created_at } });
  } catch (e) {
    res.status(500).json({ error: 'Server error.' });
  }
};

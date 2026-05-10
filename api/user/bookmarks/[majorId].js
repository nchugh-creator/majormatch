const { getPool } = require('../../_lib/db');
const { setCors, requireAuth } = require('../../_lib/auth');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = requireAuth(req, res);
  if (!user) return;

  const { majorId } = req.query;

  try {
    const db = getPool();
    const existing = await db.query(
      'SELECT id FROM bookmarks WHERE user_id = $1 AND major_id = $2',
      [user.id, majorId]
    );
    if (existing.rows.length) {
      await db.query('DELETE FROM bookmarks WHERE user_id = $1 AND major_id = $2', [user.id, majorId]);
      return res.json({ bookmarked: false });
    } else {
      await db.query('INSERT INTO bookmarks (user_id, major_id) VALUES ($1, $2)', [user.id, majorId]);
      return res.json({ bookmarked: true });
    }
  } catch (e) {
    res.status(500).json({ error: 'Server error.' });
  }
};

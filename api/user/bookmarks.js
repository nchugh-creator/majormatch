const { getPool } = require('../_lib/db');
const { setCors, requireAuth } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = requireAuth(req, res);
  if (!user) return;

  const db = getPool();

  // GET — fetch all bookmarks
  if (req.method === 'GET') {
    try {
      const result = await db.query(
        'SELECT major_id FROM bookmarks WHERE user_id = $1 ORDER BY created_at',
        [user.id]
      );
      return res.json({ bookmarks: result.rows.map(r => r.major_id) });
    } catch (e) {
      return res.status(500).json({ error: 'Server error.' });
    }
  }

  // PUT — replace full bookmark list (used on login to sync local → server)
  if (req.method === 'PUT') {
    const { bookmarks } = req.body || {};
    if (!Array.isArray(bookmarks)) return res.status(400).json({ error: 'bookmarks must be an array.' });
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM bookmarks WHERE user_id = $1', [user.id]);
      for (const id of bookmarks) {
        await client.query(
          'INSERT INTO bookmarks (user_id, major_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [user.id, id]
        );
      }
      await client.query('COMMIT');
      return res.json({ ok: true });
    } catch (e) {
      await client.query('ROLLBACK');
      return res.status(500).json({ error: 'Server error.' });
    } finally {
      client.release();
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
};

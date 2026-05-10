const { getPool } = require('../_lib/db');
const { setCors, requireAuth } = require('../_lib/auth');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = requireAuth(req, res);
  if (!user) return;

  const db = getPool();

  // GET — most recent quiz result
  if (req.method === 'GET') {
    try {
      const result = await db.query(
        'SELECT answers, top_majors, taken_at FROM quiz_results WHERE user_id = $1 ORDER BY taken_at DESC LIMIT 1',
        [user.id]
      );
      return res.json(result.rows[0] || null);
    } catch (e) {
      return res.status(500).json({ error: 'Server error.' });
    }
  }

  // POST — save a quiz result
  if (req.method === 'POST') {
    const { answers, topMajors } = req.body || {};
    try {
      await db.query(
        'INSERT INTO quiz_results (user_id, answers, top_majors) VALUES ($1, $2, $3)',
        [user.id, JSON.stringify(answers), JSON.stringify(topMajors)]
      );
      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: 'Server error.' });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
};

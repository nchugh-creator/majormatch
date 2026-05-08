const router = require('express').Router();
const db = require('../db');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

// GET /api/user/bookmarks
router.get('/bookmarks', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT major_id FROM bookmarks WHERE user_id = $1 ORDER BY created_at',
      [req.user.id]
    );
    res.json({ bookmarks: result.rows.map(r => r.major_id) });
  } catch (e) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/user/bookmarks/:majorId — toggle a single bookmark
router.post('/bookmarks/:majorId', async (req, res) => {
  const { majorId } = req.params;
  try {
    const existing = await db.query(
      'SELECT id FROM bookmarks WHERE user_id = $1 AND major_id = $2',
      [req.user.id, majorId]
    );
    if (existing.rows.length) {
      await db.query('DELETE FROM bookmarks WHERE user_id = $1 AND major_id = $2', [req.user.id, majorId]);
      res.json({ bookmarked: false });
    } else {
      await db.query('INSERT INTO bookmarks (user_id, major_id) VALUES ($1, $2)', [req.user.id, majorId]);
      res.json({ bookmarked: true });
    }
  } catch (e) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /api/user/bookmarks — replace full bookmark list (used on login to sync)
router.put('/bookmarks', async (req, res) => {
  const { bookmarks } = req.body;
  if (!Array.isArray(bookmarks)) return res.status(400).json({ error: 'bookmarks must be an array.' });
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM bookmarks WHERE user_id = $1', [req.user.id]);
    for (const id of bookmarks) {
      await client.query(
        'INSERT INTO bookmarks (user_id, major_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [req.user.id, id]
      );
    }
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Server error.' });
  } finally {
    client.release();
  }
});

// POST /api/user/quiz — save a quiz result
router.post('/quiz', async (req, res) => {
  const { answers, topMajors } = req.body;
  try {
    await db.query(
      'INSERT INTO quiz_results (user_id, answers, top_majors) VALUES ($1, $2, $3)',
      [req.user.id, JSON.stringify(answers), JSON.stringify(topMajors)]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/user/quiz — get most recent quiz result
router.get('/quiz', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT answers, top_majors, taken_at FROM quiz_results WHERE user_id = $1 ORDER BY taken_at DESC LIMIT 1',
      [req.user.id]
    );
    res.json(result.rows[0] || null);
  } catch (e) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;

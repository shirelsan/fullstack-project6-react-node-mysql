const express = require('express');
const router = express.Router();
const pool = require('../db');
const { getCached, setCached, invalidateByPrefixes } = require('../cache');

// Get comments (filters: ?post_id=, ?user_id=, ?body_like=)
router.get('/', async (req, res) => {
  const cacheKey = req.originalUrl;
  const cached = getCached(cacheKey);
  if (cached) return res.set('X-Cache', 'HIT').json(cached);
  const { post_id, user_id, body_like } = req.query;
  try {
    let query = 'SELECT * FROM comments';
    const conditions = [];
    const params = [];
    if (post_id) {
      conditions.push('post_id = ?');
      params.push(post_id);
    }
    if (user_id) {
      conditions.push('user_id = ?');
      params.push(user_id);
    }
    if (body_like) {
      conditions.push('body LIKE ?');
      params.push(`%${body_like}%`);
    }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY id ASC';
    const [rows] = await pool.query(query, params);
    setCached(cacheKey, rows);
    res.set('X-Cache', 'MISS').json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get comment by ID
router.get('/:id', async (req, res) => {
  const cacheKey = req.originalUrl;
  const cached = getCached(cacheKey);
  if (cached) return res.set('X-Cache', 'HIT').json(cached);
  try {
    const [rows] = await pool.query('SELECT * FROM comments WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Comment not found' });
    setCached(cacheKey, rows[0]);
    res.set('X-Cache', 'MISS').json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new comment
router.post('/', async (req, res) => {
  const { post_id, user_id, name, email, body } = req.body;
  if (!post_id || !name || !email || !body) {
    return res.status(400).json({ message: 'post_id, name, email, and body are required' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO comments (post_id, user_id, name, email, body) VALUES (?, ?, ?, ?, ?)',
      [post_id, user_id || null, name, email, body]
    );
    invalidateByPrefixes(['/api/comments', '/api/posts']);
    res.status(201).json({ id: result.insertId, post_id, user_id: user_id || null, name, email, body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update comment (only the owner may edit)
router.put('/:id', async (req, res) => {
  const { name, email, body, user_id } = req.body;
  if (!user_id) {
    return res.status(400).json({ message: 'user_id is required' });
  }
  try {
    const [rows] = await pool.query('SELECT * FROM comments WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Comment not found' });
    if (rows[0].user_id !== Number(user_id)) {
      return res.status(403).json({ message: 'You can only edit your own comments' });
    }
    await pool.query(
      'UPDATE comments SET name = COALESCE(?, name), email = COALESCE(?, email), body = COALESCE(?, body) WHERE id = ?',
      [name, email, body, req.params.id]
    );
    const [updated] = await pool.query('SELECT * FROM comments WHERE id = ?', [req.params.id]);
    // Minor update policy: keep list caches on PUT; they refresh via TTL.
    setCached(req.originalUrl, updated[0]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete comment (only the owner may delete)
router.delete('/:id', async (req, res) => {
  const user_id = req.body.user_id ?? req.query.user_id;
  if (!user_id) {
    return res.status(400).json({ message: 'user_id is required' });
  }
  try {
    const [rows] = await pool.query('SELECT * FROM comments WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Comment not found' });
    if (rows[0].user_id !== Number(user_id)) {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }
    await pool.query('DELETE FROM comments WHERE id = ?', [req.params.id]);
    invalidateByPrefixes(['/api/comments', '/api/posts']);
    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get posts (filters: ?user_id=, ?title_like=, ?q= searches title+body, sort: ?_sort=&_order=, pagination: ?_limit=&_page=)
router.get('/', async (req, res) => {
  const { user_id, title_like, q, _sort, _order, _limit, _page } = req.query;
  try {
    let query = 'SELECT * FROM posts';
    const conditions = [];
    const params = [];
    if (user_id) {
      conditions.push('user_id = ?');
      params.push(user_id);
    }
    if (title_like) {
      conditions.push('title LIKE ?');
      params.push(`%${title_like}%`);
    }
    if (q) {
      conditions.push('(title LIKE ? OR body LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    // Whitelist sortable columns to prevent SQL injection
    const sortable = ['id', 'title', 'user_id'];
    const sortCol = sortable.includes(_sort) ? _sort : 'id';
    const sortDir = String(_order).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortCol} ${sortDir}`;
    if (_limit) {
      const limit = Math.max(1, parseInt(_limit, 10) || 10);
      const page = Math.max(1, parseInt(_page, 10) || 1);
      query += ' LIMIT ? OFFSET ?';
      params.push(limit, (page - 1) * limit);
    }
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get comments of a post (jsonplaceholder style: /posts/:id/comments)
router.get('/:id/comments', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM comments WHERE post_id = ? ORDER BY id ASC', [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get post by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Post not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new post
router.post('/', async (req, res) => {
  const { user_id, title, body } = req.body;
  if (!user_id || !title || !body) {
    return res.status(400).json({ message: 'user_id, title, and body are required' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO posts (user_id, title, body) VALUES (?, ?, ?)',
      [user_id, title, body]
    );
    res.status(201).json({ id: result.insertId, user_id, title, body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update post (only the owner may edit)
router.put('/:id', async (req, res) => {
  const { title, body, user_id } = req.body;
  if (!user_id) {
    return res.status(400).json({ message: 'user_id is required' });
  }
  try {
    const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Post not found' });
    if (rows[0].user_id !== Number(user_id)) {
      return res.status(403).json({ message: 'You can only edit your own posts' });
    }
    await pool.query(
      'UPDATE posts SET title = COALESCE(?, title), body = COALESCE(?, body) WHERE id = ?',
      [title, body, req.params.id]
    );
    const [updated] = await pool.query('SELECT * FROM posts WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete post (only the owner may delete)
router.delete('/:id', async (req, res) => {
  const user_id = req.body.user_id ?? req.query.user_id;
  if (!user_id) {
    return res.status(400).json({ message: 'user_id is required' });
  }
  try {
    const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Post not found' });
    if (rows[0].user_id !== Number(user_id)) {
      return res.status(403).json({ message: 'You can only delete your own posts' });
    }
    await pool.query('DELETE FROM posts WHERE id = ?', [req.params.id]);
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

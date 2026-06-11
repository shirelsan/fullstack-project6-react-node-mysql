const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get posts (supports optional user_id filter)
router.get('/', async (req, res) => {
  const { user_id } = req.query;
  try {
    let query = 'SELECT * FROM posts';
    let params = [];
    if (user_id) {
      query += ' WHERE user_id = ?';
      params.push(user_id);
    }
    query += ' ORDER BY id ASC';
    const [rows] = await pool.query(query, params);
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

// Update post
router.put('/:id', async (req, res) => {
  const { title, body } = req.body;
  try {
    await pool.query(
      'UPDATE posts SET title = COALESCE(?, title), body = COALESCE(?, body) WHERE id = ?',
      [title, body, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete post
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM posts WHERE id = ?', [req.params.id]);
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

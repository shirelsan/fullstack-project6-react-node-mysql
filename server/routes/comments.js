const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get comments (supports optional post_id filter)
router.get('/', async (req, res) => {
  const { post_id } = req.query;
  try {
    let query = 'SELECT * FROM comments';
    let params = [];
    if (post_id) {
      query += ' WHERE post_id = ?';
      params.push(post_id);
    }
    query += ' ORDER BY id ASC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get comment by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM comments WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Comment not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new comment
router.post('/', async (req, res) => {
  const { post_id, name, email, body } = req.body;
  if (!post_id || !name || !email || !body) {
    return res.status(400).json({ message: 'post_id, name, email, and body are required' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO comments (post_id, name, email, body) VALUES (?, ?, ?, ?)',
      [post_id, name, email, body]
    );
    res.status(201).json({ id: result.insertId, post_id, name, email, body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update comment
router.put('/:id', async (req, res) => {
  const { name, email, body } = req.body;
  try {
    await pool.query(
      'UPDATE comments SET name = COALESCE(?, name), email = COALESCE(?, email), body = COALESCE(?, body) WHERE id = ?',
      [name, email, body, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM comments WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete comment
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM comments WHERE id = ?', [req.params.id]);
    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

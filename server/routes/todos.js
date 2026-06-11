const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get todos (supports optional user_id filter via query params)
router.get('/', async (req, res) => {
  const { user_id } = req.query;
  try {
    let query = 'SELECT * FROM todos';
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

// Get todo by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM todos WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Todo not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new todo
router.post('/', async (req, res) => {
  const { user_id, title, completed } = req.body;
  if (!user_id || !title) {
    return res.status(400).json({ message: 'user_id and title are required' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO todos (user_id, title, completed) VALUES (?, ?, ?)',
      [user_id, title, completed || false]
    );
    res.status(201).json({ id: result.insertId, user_id, title, completed: completed || false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update todo (e.g., mark as completed)
router.put('/:id', async (req, res) => {
  const { title, completed } = req.body;
  try {
    await pool.query(
      'UPDATE todos SET title = COALESCE(?, title), completed = COALESCE(?, completed) WHERE id = ?',
      [title, completed, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM todos WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete todo
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM todos WHERE id = ?', [req.params.id]);
    res.json({ message: 'Todo deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get todos (filters: ?user_id=, ?completed=, ?title_like=, sort: ?_sort=&_order=, pagination: ?_limit=&_page=)
router.get('/', async (req, res) => {
  const { user_id, completed, title_like, _sort, _order, _limit, _page } = req.query;
  try {
    let query = 'SELECT * FROM todos';
    const conditions = [];
    const params = [];
    if (user_id) {
      conditions.push('user_id = ?');
      params.push(user_id);
    }
    if (completed !== undefined) {
      conditions.push('completed = ?');
      params.push(completed === 'true' || completed === '1' ? 1 : 0);
    }
    if (title_like) {
      conditions.push('title LIKE ?');
      params.push(`%${title_like}%`);
    }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    // Whitelist sortable columns to prevent SQL injection
    const sortable = ['id', 'title', 'completed', 'user_id'];
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

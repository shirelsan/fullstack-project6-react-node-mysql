const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get albums (filters: ?user_id=, ?title_like=)
router.get('/', async (req, res) => {
  const { user_id, title_like } = req.query;
  try {
    let query = 'SELECT * FROM albums';
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
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY id ASC';
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get album by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM albums WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Album not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get photos of an album (jsonplaceholder style: /albums/:id/photos)
router.get('/:id/photos', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM photos WHERE album_id = ? ORDER BY id ASC', [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new album
router.post('/', async (req, res) => {
  const { user_id, title } = req.body;
  if (!user_id || !title) {
    return res.status(400).json({ message: 'user_id and title are required' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO albums (user_id, title) VALUES (?, ?)',
      [user_id, title]
    );
    res.status(201).json({ id: result.insertId, user_id, title });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update album (only the owner may edit)
router.put('/:id', async (req, res) => {
  const { title, user_id } = req.body;
  if (!user_id) {
    return res.status(400).json({ message: 'user_id is required' });
  }
  try {
    const [rows] = await pool.query('SELECT * FROM albums WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Album not found' });
    if (rows[0].user_id !== Number(user_id)) {
      return res.status(403).json({ message: 'You can only edit your own albums' });
    }
    await pool.query('UPDATE albums SET title = COALESCE(?, title) WHERE id = ?', [title, req.params.id]);
    const [updated] = await pool.query('SELECT * FROM albums WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete album (only the owner may delete; photos cascade)
router.delete('/:id', async (req, res) => {
  const user_id = req.body.user_id ?? req.query.user_id;
  if (!user_id) {
    return res.status(400).json({ message: 'user_id is required' });
  }
  try {
    const [rows] = await pool.query('SELECT * FROM albums WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Album not found' });
    if (rows[0].user_id !== Number(user_id)) {
      return res.status(403).json({ message: 'You can only delete your own albums' });
    }
    await pool.query('DELETE FROM albums WHERE id = ?', [req.params.id]);
    res.json({ message: 'Album deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

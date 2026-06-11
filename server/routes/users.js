const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all users
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, username, email, phone, website FROM users');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, username, email, phone, website FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user details
router.put('/:id', async (req, res) => {
  const { name, email, phone, website } = req.body;
  try {
    await pool.query(
      'UPDATE users SET name = ?, email = ?, phone = ?, website = ? WHERE id = ?',
      [name, email, phone, website, req.params.id]
    );
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

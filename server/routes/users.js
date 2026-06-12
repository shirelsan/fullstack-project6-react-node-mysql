const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db');

// Public user fields (never expose password hashes; role/blocked are managed via /api/admin)
const PUBLIC_FIELDS = 'id, name, username, email, phone, website';

// Get all users
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT ${PUBLIC_FIELDS} FROM users`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ?`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user details (requires current password as verification)
router.put('/:id', async (req, res) => {
  const { name, email, phone, website, current_password } = req.body;
  if (!current_password) {
    return res.status(400).json({ message: 'current_password is required' });
  }
  try {
    const [passwords] = await pool.query('SELECT password_hash FROM passwords WHERE user_id = ?', [req.params.id]);
    if (passwords.length === 0) return res.status(404).json({ message: 'User not found' });

    const match = await bcrypt.compare(current_password, passwords[0].password_hash);
    if (!match) {
      return res.status(403).json({ message: 'Incorrect password' });
    }

    await pool.query(
      'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone), website = COALESCE(?, website) WHERE id = ?',
      [name, email, phone, website, req.params.id]
    );
    const [rows] = await pool.query(`SELECT ${PUBLIC_FIELDS}, role, blocked FROM users WHERE id = ?`, [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change password (requires current password as verification)
router.put('/:id/password', async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    return res.status(400).json({ message: 'current_password and new_password are required' });
  }
  if (new_password.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' });
  }
  try {
    const [passwords] = await pool.query('SELECT password_hash FROM passwords WHERE user_id = ?', [req.params.id]);
    if (passwords.length === 0) return res.status(404).json({ message: 'User not found' });

    const match = await bcrypt.compare(current_password, passwords[0].password_hash);
    if (!match) {
      return res.status(403).json({ message: 'Incorrect current password' });
    }

    const hash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE passwords SET password_hash = ? WHERE user_id = ?', [hash, req.params.id]);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

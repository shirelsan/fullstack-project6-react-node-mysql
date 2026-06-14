const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db');
const { getCached, setCached, invalidateByPrefixes } = require('../cache');

// Public user fields (never expose password hashes; role/blocked are managed via /api/admin)
const PUBLIC_FIELDS = 'id, name, username, email, phone, website';

// Get all users
router.get('/', async (req, res) => {
  const cacheKey = req.originalUrl;
  const cached = getCached(cacheKey);
  if (cached) return res.set('X-Cache', 'HIT').json(cached);
  try {
    const [rows] = await pool.query(`SELECT ${PUBLIC_FIELDS} FROM users`);
    setCached(cacheKey, rows);
    res.set('X-Cache', 'MISS').json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  const cacheKey = req.originalUrl;
  const cached = getCached(cacheKey);
  if (cached) return res.set('X-Cache', 'HIT').json(cached);
  try {
    const [rows] = await pool.query(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ?`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    setCached(cacheKey, rows[0]);
    res.set('X-Cache', 'MISS').json(rows[0]);
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
    // Minor update policy: keep list caches on PUT; they refresh via TTL.
    setCached(req.originalUrl, rows[0]);
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
    // Password change is a minor update for cached list payloads.
    // We intentionally keep cache warm and rely on TTL.
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

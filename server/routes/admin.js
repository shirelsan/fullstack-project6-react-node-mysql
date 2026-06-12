const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db');

// Middleware: verify the requester is an admin.
// Admin credentials are sent with each request (admin_id + admin_password)
// since this project does not use tokens/sessions.
async function requireAdmin(req, res, next) {
  const admin_id = req.body.admin_id ?? req.query.admin_id;
  const admin_password = req.body.admin_password ?? req.query.admin_password;
  if (!admin_id || !admin_password) {
    return res.status(401).json({ message: 'Admin credentials are required' });
  }
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [admin_id]);
    if (users.length === 0 || users[0].role !== 'admin' || users[0].blocked) {
      return res.status(403).json({ message: 'Admin access denied' });
    }
    const [passwords] = await pool.query('SELECT password_hash FROM passwords WHERE user_id = ?', [admin_id]);
    const match = passwords.length > 0 && await bcrypt.compare(admin_password, passwords[0].password_hash);
    if (!match) {
      return res.status(403).json({ message: 'Admin access denied' });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

router.use(requireAdmin);

// List all users with role/blocked status and activity counts
router.post('/users', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.name, u.username, u.email, u.role, u.blocked,
        (SELECT COUNT(*) FROM todos t WHERE t.user_id = u.id) AS todo_count,
        (SELECT COUNT(*) FROM posts p WHERE p.user_id = u.id) AS post_count,
        (SELECT COUNT(*) FROM comments c WHERE c.user_id = u.id) AS comment_count,
        (SELECT COUNT(*) FROM albums a WHERE a.user_id = u.id) AS album_count
      FROM users u ORDER BY u.id ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Block / unblock a user
router.put('/users/:id/block', async (req, res) => {
  const { blocked } = req.body;
  if (blocked === undefined) {
    return res.status(400).json({ message: 'blocked (true/false) is required' });
  }
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });
    if (users[0].role === 'admin') {
      return res.status(403).json({ message: 'Cannot block an admin account' });
    }
    // Unblocking also resets the failed login attempts counter
    await pool.query('UPDATE users SET blocked = ?, failed_attempts = IF(?, failed_attempts, 0) WHERE id = ?', [blocked ? 1 : 0, blocked ? 1 : 0, req.params.id]);
    res.json({ message: blocked ? 'User blocked' : 'User unblocked' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a user entirely (todos/posts/comments/albums cascade)
router.delete('/users/:id', async (req, res) => {
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });
    if (users[0].role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete an admin account' });
    }
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db');
const { invalidateByPrefixes } = require('../cache');

// Register
router.post('/register', async (req, res) => {
  const { name, username, email, phone, website, password } = req.body;
  if (!username || !password || !name) {
    return res.status(400).json({ message: 'Name, username and password are required' });
  }

  try {
    // Check if user exists
    const [existing] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert user
      const [result] = await connection.query(
        'INSERT INTO users (name, username, email, phone, website) VALUES (?, ?, ?, ?, ?)',
        [name, username, email || '', phone || '', website || '']
      );

      const userId = result.insertId;

      // Hash password
      const hash = await bcrypt.hash(password, 10);
      
      // Insert password
      await connection.query('INSERT INTO passwords (user_id, password_hash) VALUES (?, ?)', [userId, hash]);

      await connection.commit();
      
      // Return user without password
      const [user] = await connection.query('SELECT * FROM users WHERE id = ?', [userId]);
      invalidateByPrefixes(['/api/users', '/api/admin/users']);
      res.status(201).json(user[0]);

    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = users[0];

    if (user.blocked) {
      return res.status(403).json({ message: 'Your account has been blocked. Contact the administrator.' });
    }

    const [passwords] = await pool.query('SELECT password_hash FROM passwords WHERE user_id = ?', [user.id]);
    if (passwords.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const match = await bcrypt.compare(password, passwords[0].password_hash);
    if (!match) {
      // Count consecutive failed attempts; block after 3 (admins are exempt to avoid lockout)
      const attempts = user.failed_attempts + 1;
      if (attempts >= 3 && user.role !== 'admin') {
        await pool.query('UPDATE users SET failed_attempts = ?, blocked = TRUE WHERE id = ?', [attempts, user.id]);
        invalidateByPrefixes(['/api/users', '/api/admin/users']);
        return res.status(403).json({ message: 'Too many failed login attempts. Your account has been blocked. Contact the administrator.' });
      }
      await pool.query('UPDATE users SET failed_attempts = ? WHERE id = ?', [attempts, user.id]);
      const remaining = user.role === 'admin' ? null : 3 - attempts;
      return res.status(401).json({
        message: remaining !== null
          ? `Invalid username or password (${remaining} attempt${remaining === 1 ? '' : 's'} left before your account is blocked)`
          : 'Invalid username or password'
      });
    }

    // Successful login resets the failed attempts counter
    if (user.failed_attempts > 0) {
      await pool.query('UPDATE users SET failed_attempts = 0 WHERE id = ?', [user.id]);
      user.failed_attempts = 0;
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const pool = require('../db');

// Helper: get the owner (user_id) of the album a photo belongs to
async function getPhotoWithOwner(photoId) {
  const [rows] = await pool.query(
    'SELECT photos.*, albums.user_id AS owner_id FROM photos JOIN albums ON photos.album_id = albums.id WHERE photos.id = ?',
    [photoId]
  );
  return rows[0];
}

// Get photos (filters: ?album_id=, ?title_like=, pagination: ?_limit=, ?_page=)
router.get('/', async (req, res) => {
  const { album_id, title_like, _limit, _page } = req.query;
  try {
    let query = 'SELECT * FROM photos';
    const conditions = [];
    const params = [];
    if (album_id) {
      conditions.push('album_id = ?');
      params.push(album_id);
    }
    if (title_like) {
      conditions.push('title LIKE ?');
      params.push(`%${title_like}%`);
    }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY id ASC';
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

// Get photo by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM photos WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Photo not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new photo (only into the user's own album)
router.post('/', async (req, res) => {
  const { album_id, title, url, thumbnail_url, user_id } = req.body;
  if (!album_id || !title || !url || !user_id) {
    return res.status(400).json({ message: 'album_id, title, url, and user_id are required' });
  }
  try {
    const [albums] = await pool.query('SELECT * FROM albums WHERE id = ?', [album_id]);
    if (albums.length === 0) return res.status(404).json({ message: 'Album not found' });
    if (albums[0].user_id !== Number(user_id)) {
      return res.status(403).json({ message: 'You can only add photos to your own albums' });
    }
    const [result] = await pool.query(
      'INSERT INTO photos (album_id, title, url, thumbnail_url) VALUES (?, ?, ?, ?)',
      [album_id, title, url, thumbnail_url || url]
    );
    res.status(201).json({ id: result.insertId, album_id, title, url, thumbnail_url: thumbnail_url || url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update photo (only the album owner may edit)
router.put('/:id', async (req, res) => {
  const { title, url, thumbnail_url, user_id } = req.body;
  if (!user_id) {
    return res.status(400).json({ message: 'user_id is required' });
  }
  try {
    const photo = await getPhotoWithOwner(req.params.id);
    if (!photo) return res.status(404).json({ message: 'Photo not found' });
    if (photo.owner_id !== Number(user_id)) {
      return res.status(403).json({ message: 'You can only edit photos in your own albums' });
    }
    await pool.query(
      'UPDATE photos SET title = COALESCE(?, title), url = COALESCE(?, url), thumbnail_url = COALESCE(?, thumbnail_url) WHERE id = ?',
      [title, url, thumbnail_url, req.params.id]
    );
    const [updated] = await pool.query('SELECT * FROM photos WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete photo (only the album owner may delete)
router.delete('/:id', async (req, res) => {
  const user_id = req.body.user_id ?? req.query.user_id;
  if (!user_id) {
    return res.status(400).json({ message: 'user_id is required' });
  }
  try {
    const photo = await getPhotoWithOwner(req.params.id);
    if (!photo) return res.status(404).json({ message: 'Photo not found' });
    if (photo.owner_id !== Number(user_id)) {
      return res.status(403).json({ message: 'You can only delete photos in your own albums' });
    }
    await pool.query('DELETE FROM photos WHERE id = ?', [req.params.id]);
    res.json({ message: 'Photo deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

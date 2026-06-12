import { useState, useEffect } from 'react';
import axios from 'axios';

function Albums() {
  const [albums, setAlbums] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [search, setSearch] = useState('');
  const [expandedAlbum, setExpandedAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchAlbums();
  }, [search]);

  const fetchAlbums = async () => {
    try {
      let url = `http://localhost:5000/api/albums?user_id=${user.id}`;
      if (search.trim()) url += `&title_like=${encodeURIComponent(search)}`;
      const res = await axios.get(url);
      setAlbums(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPhotos = async (albumId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/albums/${albumId}/photos`);
      setPhotos(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddAlbum = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const res = await axios.post('http://localhost:5000/api/albums', {
        user_id: user.id,
        title: newTitle
      });
      setAlbums([...albums, res.data]);
      setNewTitle('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateAlbum = async (e, id) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    try {
      const res = await axios.put(`http://localhost:5000/api/albums/${id}`, {
        user_id: user.id,
        title: editTitle
      });
      setAlbums(albums.map(a => a.id === id ? res.data : a));
      setEditingAlbum(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update album');
    }
  };

  const handleDeleteAlbum = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/albums/${id}`, { data: { user_id: user.id } });
      setAlbums(albums.filter(a => a.id !== id));
      if (expandedAlbum === id) setExpandedAlbum(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete album');
    }
  };

  const togglePhotos = (albumId) => {
    if (expandedAlbum === albumId) {
      setExpandedAlbum(null);
    } else {
      setExpandedAlbum(albumId);
      fetchPhotos(albumId);
    }
  };

  const handleAddPhoto = async (e, albumId) => {
    e.preventDefault();
    if (!newPhotoTitle.trim() || !newPhotoUrl.trim()) return;
    try {
      const res = await axios.post('http://localhost:5000/api/photos', {
        album_id: albumId,
        user_id: user.id,
        title: newPhotoTitle,
        url: newPhotoUrl,
        thumbnail_url: newPhotoUrl
      });
      setPhotos([...photos, res.data]);
      setNewPhotoTitle('');
      setNewPhotoUrl('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add photo');
    }
  };

  const handleDeletePhoto = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/photos/${id}`, { data: { user_id: user.id } });
      setPhotos(photos.filter(p => p.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete photo');
    }
  };

  return (
    <div>
      <h1 className="page-title">My Albums</h1>

      <div className="add-form" style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search albums by title..."
        />
      </div>

      <form className="add-form" onSubmit={handleAddAlbum}>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New album title..."
        />
        <button type="submit" className="btn btn-sm">Add Album</button>
      </form>

      <div className="item-list">
        {albums.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No albums found.</div>
        ) : (
          albums.map(album => (
            <div key={album.id} className="item-card">
              {editingAlbum === album.id ? (
                <form onSubmit={(e) => handleUpdateAlbum(e, album.id)} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                  />
                  <button type="submit" className="btn btn-sm">Save</button>
                  <button type="button" onClick={() => setEditingAlbum(null)} className="btn btn-sm btn-danger">Cancel</button>
                </form>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ color: 'var(--primary)' }}>{album.title}</h3>
                      <small style={{ color: 'var(--text-muted)' }}>Album ID: {album.id}</small>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => { setEditingAlbum(album.id); setEditTitle(album.title); }} className="btn btn-sm">Edit</button>
                      <button onClick={() => handleDeleteAlbum(album.id)} className="btn btn-sm btn-danger">Delete</button>
                    </div>
                  </div>

                  <button
                    onClick={() => togglePhotos(album.id)}
                    className="btn btn-sm"
                    style={{ marginTop: '0.75rem', background: 'var(--surface-hover)', color: 'var(--primary)', border: '1px solid var(--border)' }}
                  >
                    {expandedAlbum === album.id ? 'Hide Photos' : 'Show Photos'}
                  </button>

                  {expandedAlbum === album.id && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                        {photos.length === 0 ? (
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No photos in this album yet.</div>
                        ) : (
                          photos.map(photo => (
                            <div key={photo.id} style={{ width: '160px', textAlign: 'center' }}>
                              <img
                                src={photo.thumbnail_url}
                                alt={photo.title}
                                style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                              />
                              <div style={{ fontSize: '0.85rem', margin: '0.25rem 0' }}>{photo.title}</div>
                              <button onClick={() => handleDeletePhoto(photo.id)} className="btn btn-sm btn-danger">Delete</button>
                            </div>
                          ))
                        )}
                      </div>

                      <form onSubmit={(e) => handleAddPhoto(e, album.id)} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          value={newPhotoTitle}
                          onChange={(e) => setNewPhotoTitle(e.target.value)}
                          placeholder="Photo title..."
                          style={{ flex: 1, minWidth: '150px', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                        />
                        <input
                          type="text"
                          value={newPhotoUrl}
                          onChange={(e) => setNewPhotoUrl(e.target.value)}
                          placeholder="Photo URL (https://...)"
                          style={{ flex: 2, minWidth: '200px', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                        />
                        <button type="submit" className="btn btn-sm">Add Photo</button>
                      </form>
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Albums;

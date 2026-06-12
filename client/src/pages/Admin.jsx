import { useState, useEffect } from 'react';
import axios from 'axios';

function Admin() {
  const [users, setUsers] = useState([]);
  const [password, setPassword] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user'));

  const adminCreds = () => ({ admin_id: user.id, admin_password: password });

  const fetchUsers = async (pw = password) => {
    try {
      const res = await axios.post('http://localhost:5000/api/admin/users', {
        admin_id: user.id,
        admin_password: pw
      });
      setUsers(res.data);
      setUnlocked(true);
      setError('');
    } catch (err) {
      setUnlocked(false);
      setError(err.response?.data?.message || 'Access denied');
    }
  };

  const handleUnlock = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleBlock = async (id, blocked) => {
    try {
      await axios.put(`http://localhost:5000/api/admin/users/${id}/block`, {
        ...adminCreds(),
        blocked
      });
      setUsers(users.map(u => u.id === id ? { ...u, blocked: blocked ? 1 : 0 } : u));
    } catch (err) {
      alert(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDeleteUser = async (id, username) => {
    if (!window.confirm(`Delete user "${username}" and ALL their data? This cannot be undone.`)) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${id}`, { data: adminCreds() });
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Operation failed');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div>
        <h1 className="page-title">Admin Panel</h1>
        <div className="error-message">This page is only available to administrators.</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Admin Panel</h1>

      {!unlocked ? (
        <div className="item-card" style={{ maxWidth: '400px' }}>
          <p style={{ marginBottom: '1rem' }}>Confirm your admin password to manage users.</p>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleUnlock} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              required
              style={{ flex: 1, padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
            />
            <button type="submit" className="btn btn-sm">Unlock</button>
          </form>
        </div>
      ) : (
        <div className="item-list">
          {users.map(u => (
            <div key={u.id} className="item-card" style={{ opacity: u.blocked ? 0.6 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ color: 'var(--primary)' }}>
                    {u.name} <small style={{ color: 'var(--text-muted)' }}>(@{u.username})</small>
                    {u.role === 'admin' && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', background: 'var(--primary)', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '0.5rem' }}>ADMIN</span>}
                    {!!u.blocked && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', background: 'crimson', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '0.5rem' }}>BLOCKED</span>}
                  </h3>
                  <small style={{ color: 'var(--text-muted)' }}>
                    ID: {u.id} | {u.email} | {u.todo_count} todos, {u.post_count} posts, {u.comment_count} comments, {u.album_count} albums
                  </small>
                </div>
                {u.role !== 'admin' && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleBlock(u.id, !u.blocked)} className="btn btn-sm">
                      {u.blocked ? 'Unblock' : 'Block'}
                    </button>
                    <button onClick={() => handleDeleteUser(u.id, u.username)} className="btn btn-sm btn-danger">Delete</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Admin;

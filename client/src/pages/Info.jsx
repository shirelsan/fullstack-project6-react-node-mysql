import { useState } from 'react';
import axios from 'axios';

function Info() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));
  const [mode, setMode] = useState('view'); // 'view' | 'edit' | 'password'
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text }

  const [profile, setProfile] = useState({ name: '', email: '', phone: '', website: '', current_password: '' });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });

  const startEdit = () => {
    setProfile({ name: user.name, email: user.email || '', phone: user.phone || '', website: user.website || '', current_password: '' });
    setMessage(null);
    setMode('edit');
  };

  const startPassword = () => {
    setPwForm({ current_password: '', new_password: '', confirm: '' });
    setMessage(null);
    setMode('password');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`http://localhost:5000/api/users/${user.id}`, profile);
      const updated = { ...user, ...res.data };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      setMode('view');
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    try {
      await axios.put(`http://localhost:5000/api/users/${user.id}/password`, {
        current_password: pwForm.current_password,
        new_password: pwForm.new_password
      });
      setMessage({ type: 'success', text: 'Password changed successfully' });
      setMode('view');
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to change password' });
    }
  };

  if (!user) return <div>Loading...</div>;

  const inputStyle = { width: '100%', padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border)' };

  return (
    <div>
      <h1 className="page-title">Personal Information</h1>

      {message && (
        <div
          className={message.type === 'error' ? 'error-message' : ''}
          style={message.type === 'success' ? { color: 'green', marginBottom: '1rem' } : { marginBottom: '1rem' }}
        >
          {message.text}
        </div>
      )}

      <div className="item-card" style={{ maxWidth: '600px' }}>
        {mode === 'view' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
              <strong style={{ color: 'var(--text-muted)' }}>Name:</strong>
              <span>{user.name}</span>

              <strong style={{ color: 'var(--text-muted)' }}>Username:</strong>
              <span>{user.username}</span>

              <strong style={{ color: 'var(--text-muted)' }}>Email:</strong>
              <span>{user.email || 'N/A'}</span>

              <strong style={{ color: 'var(--text-muted)' }}>Phone:</strong>
              <span>{user.phone || 'N/A'}</span>

              <strong style={{ color: 'var(--text-muted)' }}>Website:</strong>
              <span>{user.website || 'N/A'}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button onClick={startEdit} className="btn btn-sm">Edit Profile</button>
              <button onClick={startPassword} className="btn btn-sm">Change Password</button>
            </div>
          </>
        )}

        {mode === 'edit' && (
          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label>Name
              <input style={inputStyle} type="text" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required />
            </label>
            <label>Email
              <input style={inputStyle} type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
            </label>
            <label>Phone
              <input style={inputStyle} type="text" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            </label>
            <label>Website
              <input style={inputStyle} type="text" value={profile.website} onChange={(e) => setProfile({ ...profile, website: e.target.value })} />
            </label>
            <label>Current password (required to save)
              <input style={inputStyle} type="password" value={profile.current_password} onChange={(e) => setProfile({ ...profile, current_password: e.target.value })} required />
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-sm">Save</button>
              <button type="button" onClick={() => setMode('view')} className="btn btn-sm btn-danger">Cancel</button>
            </div>
          </form>
        )}

        {mode === 'password' && (
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label>Current password
              <input style={inputStyle} type="password" value={pwForm.current_password} onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })} required />
            </label>
            <label>New password
              <input style={inputStyle} type="password" value={pwForm.new_password} onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })} required minLength={6} />
            </label>
            <label>Confirm new password
              <input style={inputStyle} type="password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} required minLength={6} />
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-sm">Change Password</button>
              <button type="button" onClick={() => setMode('view')} className="btn btn-sm btn-danger">Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default Info;

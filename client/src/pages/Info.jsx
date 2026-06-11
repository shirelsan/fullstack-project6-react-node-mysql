import { useEffect, useState } from 'react';

function Info() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    setUser(storedUser);
  }, []);

  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="page-title">Personal Information</h1>
      <div className="item-card" style={{ maxWidth: '600px' }}>
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
      </div>
    </div>
  );
}

export default Info;

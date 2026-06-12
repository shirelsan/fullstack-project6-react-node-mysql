import { useEffect } from 'react';
import { Outlet, useNavigate, Link, useParams, useLocation } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  const { username } = useParams();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user || user.username !== username) {
      navigate('/login');
    }
  }, [user, username, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="nav-brand" style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary)' }}>
          FullStackApp
        </div>
        <div className="nav-links">
          <Link 
            to={`/users/${username}/posts`} 
            className={`nav-link ${location.pathname === `/users/${username}/posts` ? 'active' : ''}`}
          >
            Posts
          </Link>
          <Link 
            to={`/users/${username}/todos`} 
            className={`nav-link ${location.pathname === `/users/${username}/todos` ? 'active' : ''}`}
          >
            Todos
          </Link>
          <Link 
            to={`/users/${username}/albums`} 
            className={`nav-link ${location.pathname === `/users/${username}/albums` ? 'active' : ''}`}
          >
            Albums
          </Link>
          <Link 
            to={`/users/${username}/info`} 
            className={`nav-link ${location.pathname === `/users/${username}/info` ? 'active' : ''}`}
          >
            Info
          </Link>
          {user.role === 'admin' && (
            <Link 
              to={`/users/${username}/admin`} 
              className={`nav-link ${location.pathname === `/users/${username}/admin` ? 'active' : ''}`}
            >
              Admin
            </Link>
          )}
          <button onClick={handleLogout} className="btn btn-sm btn-danger" style={{ marginLeft: '1rem' }}>
            Logout
          </button>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default Dashboard;

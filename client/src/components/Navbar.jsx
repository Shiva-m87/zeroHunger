import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardPath } from '../utils/format';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to={user ? dashboardPath(user.role) : '/'} className="logo">
          🍲 Zero<span>Hunger</span>
        </Link>

        <nav className="nav-links">
          {user ? (
            <>
              <NavLink to={dashboardPath(user.role)} end>Dashboard</NavLink>
              {user.role === 'donor' && <NavLink to="/donor/new">Donate food</NavLink>}
              <span className="nav-user">
                {user.name} <small className="role-tag">{user.role}</small>
              </span>
              <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <Link to="/register" className="btn btn-sm">Join now</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

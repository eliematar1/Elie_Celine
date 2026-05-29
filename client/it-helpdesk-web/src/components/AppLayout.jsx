import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppRoles } from '../constants/roles';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: '▣' },
  { to: '/tickets', label: 'Tickets', icon: '☰' },
  { to: '/tickets/new', label: 'Create Ticket', icon: '＋' },
  { to: '/notifications', label: 'Notifications', icon: '🔔', badge: 3 },
  { to: '/reports', label: 'Reports', icon: '◫' },
  { to: '/profile', label: 'Profile', icon: '👤' },
];

export default function AppLayout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">🛠</span>
          <div>
            <strong>IT Help Desk</strong>
            <small>Ticketing System</small>
          </div>
        </div>
        <nav className="sidebar-nav">
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
              {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
            </NavLink>
          ))}
          {(hasRole(AppRoles.Admin) || hasRole(AppRoles.Manager)) && (
            <NavLink to="/admin" className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <span className="nav-icon">⚙</span>
              Admin
            </NavLink>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="user-mini">
            <div className="avatar">{user?.firstName?.[0]}{user?.lastName?.[0]}</div>
            <div>
              <div className="user-name">{user?.firstName} {user?.lastName}</div>
              <div className="user-role">{user?.roles?.[0]}</div>
            </div>
          </div>
          <button type="button" className="btn-logout" onClick={() => { logout(); navigate('/login'); }}>
            Sign out
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="search-wrap">
            <span className="search-icon">⌕</span>
            <input type="search" placeholder="Search tickets, reference #…" className="search-input" />
          </div>
          <div className="topbar-actions">
            <NavLink to="/notifications" className="topbar-btn" title="Notifications">🔔</NavLink>
            <div className="topbar-user">
              <span className="avatar sm">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
              <span>{user?.firstName}</span>
            </div>
          </div>
        </header>
        <div className="app-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

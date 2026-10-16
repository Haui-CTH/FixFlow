// DX-FSM App Layout
import { Outlet, Link, useLocation } from 'react-router-dom';
import { logout } from '../lib/auth';
import { useAuthStore } from '../lib/store';

export default function Layout() {
  const location = useLocation();
  const { user, logout: doLogout } = useAuthStore();

  const handleLogout = () => {
    doLogout();
    logout();
  };

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/tickets', label: 'Tickets' },
    { path: '/notifications', label: 'Notifications' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{ width: '240px', background: '#1e1b4b', color: 'white', padding: '1.5rem', flexShrink: 0 }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem' }}>DX-FSM</div>
        <nav>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'block',
                padding: '0.625rem 0.75rem',
                color: location.pathname === item.path ? 'white' : '#a5b4fc',
                textDecoration: 'none',
                borderRadius: '0.375rem',
                marginBottom: '0.25rem',
                background: location.pathname === item.path ? '#4338ca' : 'transparent',
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid #4338ca' }}>
          <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>{user?.username}</div>
          <div style={{ fontSize: '0.75rem', color: '#a5b4fc', marginBottom: '1rem' }}>{user?.role}</div>
          <button onClick={handleLogout} style={{ color: '#fca5a5', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}

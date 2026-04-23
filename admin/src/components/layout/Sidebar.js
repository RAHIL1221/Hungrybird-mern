import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getInitials, avatarColor } from '../../utils/helpers';
import toast from 'react-hot-toast';

const NAV = [
  { section: 'Main', items: [
    { to: '/', icon: 'fa-solid fa-chart-line', label: 'Dashboard', perm: 'dashboard' },
    { to: '/orders', icon: 'fa-solid fa-receipt', label: 'Orders', perm: 'orders' },
  ]},
  { section: 'Catalog', items: [
    { to: '/food', icon: 'fa-solid fa-burger', label: 'Food & Menu', perm: 'food' },
    { to: '/restaurants', icon: 'fa-solid fa-store', label: 'Restaurants', perm: 'restaurants' },
  ]},
  { section: 'People', items: [
    { to: '/users', icon: 'fa-solid fa-users', label: 'Customers', perm: 'users' },
    { to: '/delivery', icon: 'fa-solid fa-motorcycle', label: 'Delivery', perm: 'delivery' },
    { to: '/admins', icon: 'fa-solid fa-user-tie', label: 'Admins', perm: 'admins' },
  ]},
  { section: 'Marketing', items: [
    { to: '/coupons', icon: 'fa-solid fa-tag', label: 'Coupons', perm: 'coupons' },
    { to: '/reviews', icon: 'fa-solid fa-star', label: 'Reviews', perm: 'reviews' },
    { to: '/notifications', icon: 'fa-solid fa-bell', label: 'Notifications', perm: 'notifications' },
  ]},
  { section: 'System', items: [
    { to: '/settings', icon: 'fa-solid fa-gear', label: 'Settings', perm: 'settings' },
  ]},
];

export default function Sidebar({ open, onClose }) {
  const { admin, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.4)',zIndex:99 }} />}
      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon"><i className="fa-solid fa-feather-pointed" /></div>
          <div>
            <div className="sidebar-logo-text">HungryBird</div>
            <div className="sidebar-logo-sub">Management Panel</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ section, items }) => {
            const visible = items.filter(i => hasPermission(i.perm));
            if (!visible.length) return null;
            return (
              <div className="nav-section" key={section}>
                <div className="nav-section-title">{section}</div>
                {visible.map(({ to, icon, label }) => (
                  <NavLink
                    key={to} to={to} end={to === '/'}
                    className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                    onClick={onClose}
                  >
                    <i className={`nav-item-icon ${icon}`} />
                    {label}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={handleLogout} title="Logout">
            <div
              className="sidebar-avatar"
              style={{ background: avatarColor(admin?.name || '') }}
            >
              {getInitials(admin?.name)}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{admin?.name}</div>
              <div className="sidebar-user-role">{admin?.role?.replace('_', ' ')} · Logout</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

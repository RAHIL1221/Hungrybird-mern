import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getInitials, avatarColor } from '../../utils/helpers';

export default function Topbar({ title, onMenuClick }) {
  const { theme, toggle } = useTheme();
  const { admin } = useAuth();

  return (
    <header className="topbar">
      <button className="btn btn-ghost btn-icon" onClick={onMenuClick} style={{ display:'none' }} id="menu-btn">
        <i className="fa-solid fa-bars" />
      </button>
      <div className="topbar-title">{title}</div>
      <div className="topbar-actions">
        <button className="btn btn-ghost btn-icon" onClick={toggle} title="Toggle theme">
          {theme === 'light' ? <i className="fa-solid fa-moon" /> : <i className="fa-solid fa-sun" />}
        </button>
        <div
          className="avatar avatar-sm"
          style={{ background: avatarColor(admin?.name || ''), cursor: 'default' }}
        >
          {getInitials(admin?.name)}
        </div>
      </div>
    </header>
  );
}

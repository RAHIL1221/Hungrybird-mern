import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { getItemCount } = useCart();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <div className="navbar-logo-icon"><i className="fa-solid fa-feather-pointed" /></div>
          <span>HungryBird</span>
        </Link>

        <div className="navbar-actions">
          <Link to="/cart" className="navbar-cart">
            <span><i className="fa-solid fa-cart-shopping" /></span>
            <span>Cart</span>
            {getItemCount() > 0 && <div className="navbar-cart-badge">{getItemCount()}</div>}
          </Link>

          {user ? (
            <div className="navbar-user" onClick={() => setShowMenu(!showMenu)}>
              <div className="navbar-avatar">{user.name?.charAt(0).toUpperCase()}</div>
              <span>{user.name}</span>
              {showMenu && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 8,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    minWidth: 180,
                    zIndex: 1000,
                  }}
                >
                  <Link
                    to="/profile"
                    style={{ display: 'block', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}
                    onClick={() => setShowMenu(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/orders"
                    style={{ display: 'block', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}
                    onClick={() => setShowMenu(false)}
                  >
                    My Orders
                  </Link>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 16px',
                      background: 'none',
                      color: 'var(--danger)',
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

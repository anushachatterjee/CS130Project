import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import './MainLayout.css';

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Get username from localStorage or use default mock user
  const username = localStorage.getItem('username') || 'testuser';
  const userInitial = username.charAt(0).toUpperCase();

  // Avatar state
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(localStorage.getItem('avatarUrl') || '');
  const [tempAvatarUrl, setTempAvatarUrl] = useState('');

  const handleAvatarClick = () => {
    setTempAvatarUrl(avatarUrl);
    setShowAvatarModal(true);
  };

  const handleSaveAvatar = () => {
    localStorage.setItem('avatarUrl', tempAvatarUrl);
    setAvatarUrl(tempAvatarUrl);
    setShowAvatarModal(false);
  };

  const handleClearAvatar = () => {
    setTempAvatarUrl('');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('avatarUrl');
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/expenses', label: 'Expenses' },
    { path: '/subscriptions', label: 'Subscriptions' },
    { path: '/budgets', label: 'Budgets' },
  ];

  return (
    <div className="main-layout">
      {/* Header */}
      <header className="header">
        <div className="logo">FinTrack</div>
      </header>

      <div className="layout-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <nav className="nav-menu">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="user-profile">
            <div className="user-avatar" onClick={handleAvatarClick}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="User avatar" className="avatar-image" />
              ) : (
                <span>{userInitial}</span>
              )}
            </div>
            <div className="username">{username}</div>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>

          {/* Avatar Modal */}
          {showAvatarModal && (
            <div className="modal-overlay" onClick={() => setShowAvatarModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>Set Avatar Image</h3>
                <input
                  type="text"
                  placeholder="Enter image URL"
                  value={tempAvatarUrl}
                  onChange={(e) => setTempAvatarUrl(e.target.value)}
                  className="avatar-input"
                />
                {tempAvatarUrl && (
                  <div className="avatar-preview">
                    <img src={tempAvatarUrl} alt="Preview" onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }} />
                  </div>
                )}
                <div className="modal-buttons">
                  <button onClick={handleSaveAvatar} className="btn-save">Save</button>
                  <button onClick={handleClearAvatar} className="btn-clear">Clear</button>
                  <button onClick={() => setShowAvatarModal(false)} className="btn-cancel">Cancel</button>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

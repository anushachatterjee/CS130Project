import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import './MainLayout.css';
import AiChatModal from '../components/AiChatModal';

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

  // AI chat modal state
  const [showChatModal, setShowChatModal] = useState(false);

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
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
          <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
          <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
          <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/>
        </svg>
      ),
    },
    {
      path: '/expenses',
      label: 'Expenses',
      icon: (
        <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M12 6v2m0 8v2M9.5 9.5C9.5 8.12 10.62 7 12 7s2.5 1.12 2.5 2.5c0 1.5-2.5 2-2.5 3.5m0 1.5h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      path: '/subscriptions',
      label: 'Subscriptions',
      icon: (
        <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4h16v3H4zM4 10h16v3H4zM4 16h10v3H4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
          <path d="M17 17.5l1.5 1.5 3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      path: '/budgets',
      label: 'Budgets',
      icon: (
        <svg className="nav-item-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 20h18M5 20V10l7-7 7 7v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 20v-5h6v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="main-layout">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            FinTrack
          </div>
          <button
            type="button"
            className="header-icon-button"
            aria-label="Toggle AI chat"
            onClick={() => setShowChatModal((open) => !open)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M4 5.5C4 4.11929 5.11929 3 6.5 3H17.5C18.8807 3 20 4.11929 20 5.5V14.5C20 15.8807 18.8807 17 17.5 17H11L7 20.5V17H6.5C5.11929 17 4 15.8807 4 14.5V5.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="M7.5 7.75H16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M7.5 11.25H14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            AI Assistant
          </button>
        </div>
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
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="user-profile">
            <div className="user-profile-inner" onClick={handleAvatarClick}>
              <div className="user-avatar">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="User avatar" className="avatar-image" />
                ) : (
                  <span>{userInitial}</span>
                )}
              </div>
              <div className="user-info">
                <div className="username">{username}</div>
                <div className="user-label">My Account</div>
              </div>
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

      <AiChatModal open={showChatModal} onClose={() => setShowChatModal(false)} />
    </div>
  );
}

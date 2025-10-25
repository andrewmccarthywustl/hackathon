import { useState } from 'react';
import './Login.css';

interface LoginProps {
  onLogin: (username: string) => void;
  currentUser: string | null;
  onLogout: () => void;
  layout?: 'sidebar' | 'page';
}

export function Login({ onLogin, currentUser, onLogout, layout = 'sidebar' }: LoginProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isSidebarLayout = layout === 'sidebar';
  const wrapperClasses = [
    'login-sidebar',
    !isSidebarLayout ? 'as-page' : '',
    sidebarCollapsed && isSidebarLayout ? 'collapsed' : ''
  ]
    .filter(Boolean)
    .join(' ');

  const handleCollapseToggle = () => {
    if (!isSidebarLayout) return;
    setSidebarCollapsed((prev) => !prev);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim());
      setUsername('');
      setEmail('');
    }
  };

  if (currentUser) {
    return (
      <div className={wrapperClasses}>
        {isSidebarLayout && (
          <button
            className="sidebar-toggle"
            onClick={handleCollapseToggle}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? '←' : '→'}
          </button>
        )}

        {(!sidebarCollapsed || !isSidebarLayout) && (
          <div className="login-box logged-in">
            <h3>Researcher Portal</h3>
            <div className="user-info">
              <div className="user-avatar">
                {currentUser.charAt(0).toUpperCase()}
              </div>
              <p className="welcome-text">Welcome back,<br/><strong>{currentUser}</strong></p>
            </div>
            <button onClick={onLogout} className="logout-btn">
              Sign Out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={wrapperClasses}>
      {isSidebarLayout && (
        <button
          className="sidebar-toggle"
          onClick={handleCollapseToggle}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? '←' : '→'}
        </button>
      )}

      {(!sidebarCollapsed || !isSidebarLayout) && (
        <>
          <div className="login-box">
            <h3>{isSignup ? 'Create Account' : 'Researcher Login'}</h3>
            <p className="login-subtitle">
              {isSignup
                ? 'Join the research community'
                : 'Access your research portal'}
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-field">
                <label>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                />
              </div>

              {isSignup && (
                <div className="form-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@university.edu"
                    required
                  />
                </div>
              )}

              <button type="submit" className="login-btn">
                {isSignup ? 'Sign Up' : 'Sign In'}
              </button>
            </form>

            <button
              className="toggle-mode"
              onClick={() => setIsSignup(!isSignup)}
            >
              {isSignup
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>

            <div className="login-divider">
              <span>or</span>
            </div>

            <button className="guest-btn" onClick={() => onLogin('Guest Researcher')}>
              Continue as Guest
            </button>
          </div>

          <div className="sidebar-info">
            <h4>About This Platform</h4>
            <p>Connect with researchers, discover papers, and explore your field with AI-powered assistance.</p>

            <div className="stats">
              <div className="stat-item">
                <strong>10K+</strong>
                <span>Papers</span>
              </div>
              <div className="stat-item">
                <strong>5K+</strong>
                <span>Researchers</span>
              </div>
              <div className="stat-item">
                <strong>100+</strong>
                <span>Institutions</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

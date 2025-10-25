import { useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Chat from './components/Chat';
import { Discover } from './components/Discover';
import { Login } from './components/Login';
import { LandingPage } from './components/LandingPage';
import { ResearcherOnboarding } from './components/ResearcherOnboarding';
import type { ResearcherProfile } from './types/profile';
import './App.css';

function App() {
  const navigate = useNavigate();
  const [showDiscover, setShowDiscover] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [googleUser, setGoogleUser] = useState<{ name: string; email: string } | null>(null);

  const handleGoogleLogin = () => {
    // Simulate Google login - in production, this would use OAuth
    const mockGoogleUser = {
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@university.edu'
    };
    setGoogleUser(mockGoogleUser);
    navigate('/onboarding');
  };

  const handleOnboardingComplete = (profile: ResearcherProfile) => {
    setCurrentUser(profile.name);
    navigate('/app');
  };

  const handleLogin = (username: string) => {
    setCurrentUser(username);
    navigate('/app');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setGoogleUser(null);
    setShowDiscover(false);
    navigate('/');
  };

  const mainApp = (
    <div className="app app-shell">
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">Synapse AI</h1>
          <nav className="app-nav">
            <button
              className={`nav-btn ${!showDiscover ? 'active' : ''}`}
              onClick={() => setShowDiscover(false)}
            >
              Chat
            </button>
            <button
              className={`nav-btn ${showDiscover ? 'active' : ''}`}
              onClick={() => setShowDiscover(true)}
            >
              Discover
            </button>
          </nav>
        </div>
        {currentUser && <div className="current-user">Logged in as {currentUser}</div>}
      </header>

      <div className="app-main">
        <div className="content-wrapper">
          {showDiscover ? <Discover /> : <Chat />}
        </div>

        <Login
          onLogin={handleLogin}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      </div>
    </div>
  );

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="app landing-route">
            <LandingPage onGoogleLogin={handleGoogleLogin} />
          </div>
        }
      />
      <Route
        path="/login"
        element={
          currentUser ? (
            <Navigate to="/app" replace />
          ) : (
            <div className="app login-route">
              <Login
                onLogin={handleLogin}
                currentUser={currentUser}
                onLogout={handleLogout}
                layout="page"
              />
            </div>
          )
        }
      />
      <Route
        path="/onboarding"
        element={
          googleUser ? (
            <div className="app onboarding-route">
              <ResearcherOnboarding
                googleEmail={googleUser.email}
                googleName={googleUser.name}
                onComplete={handleOnboardingComplete}
              />
            </div>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route path="/app" element={mainApp} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

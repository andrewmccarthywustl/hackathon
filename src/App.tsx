import { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Chat from './components/Chat';
import { Discover } from './components/Discover';
import { SavedPapers } from './components/SavedPapers';
import { ResearchCompare } from './components/ResearchCompare';
import { Login } from './components/Login';
import { LandingPage } from './components/LandingPage';
import { ResearcherOnboarding } from './components/ResearcherOnboarding';
import { ProfileDropdown } from './components/ProfileDropdown';
import type { ResearcherProfile } from './types/profile';
import { ProfileContext } from './context/ProfileContext';
import './App.css';

type ViewType = 'hub' | 'chat' | 'discover' | 'saved' | 'compare';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentView, setCurrentView] = useState<ViewType>('hub');
  const [currentProfile, setCurrentProfile] = useState<ResearcherProfile | null>(null);
  const [googleUser, setGoogleUser] = useState<{ name: string; email: string } | null>(null);

  const viewToPath = useMemo<Record<ViewType, string>>(() => ({
    hub: '',
    chat: 'chat',
    compare: 'compare',
    discover: 'collaborate',
    saved: 'saved'
  }), []);

  const pathToView = useMemo<Record<string, ViewType>>(() => ({
    '': 'hub',
    chat: 'chat',
    compare: 'compare',
    collaborate: 'discover',
    saved: 'saved'
  }), []);

  useEffect(() => {
    if (!location.pathname.startsWith('/app')) return;
    const segments = location.pathname.replace('/app', '').split('/').filter(Boolean);
    const segment = segments[0] ?? '';
    const nextView = pathToView[segment] ?? 'hub';
    setCurrentView(nextView);
  }, [location.pathname, pathToView]);

  const navigateToView = (view: ViewType) => {
    const path = viewToPath[view];
    navigate(path ? `/app/${path}` : '/app');
  };

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
    setCurrentProfile(profile);
    navigateToView('hub');
  };

  const handleLogin = (username: string) => {
    // Create a basic profile for quick login
    const quickProfile: ResearcherProfile = {
      name: username,
      email: `${username}@example.com`,
      institution: 'Quick Login User',
      researchInterests: [],
      createdAt: new Date().toISOString()
    };
    setCurrentProfile(quickProfile);
    navigateToView('hub');
  };

  const handleLogout = () => {
    setCurrentProfile(null);
    setGoogleUser(null);
    setCurrentView('chat');
    navigate('/');
  };

  const handleEditProfile = () => {
    // TODO: Implement edit profile modal
    alert('Edit profile feature coming soon!');
  };

  const mainApp = (
    <ProfileContext.Provider value={{ profile: currentProfile }}>
      <div className="app app-shell">
        <header className="app-header">
        <div className="header-left">
          <h1
            className="app-title"
            onClick={() => navigateToView('hub')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigateToView('hub')}
          >
            Synapse AI
          </h1>
          <nav className="app-nav">
            <button
              className={`nav-btn ${currentView === 'chat' ? 'active' : ''}`}
              onClick={() => navigateToView('chat')}
            >
              Chat
            </button>
            <button
              className={`nav-btn ${currentView === 'compare' ? 'active' : ''}`}
              onClick={() => navigateToView('compare')}
            >
              Research Compare
            </button>
            <button
              className={`nav-btn ${currentView === 'discover' ? 'active' : ''}`}
              onClick={() => navigateToView('discover')}
            >
              Collaborate
            </button>
            <button
              className={`nav-btn ${currentView === 'saved' ? 'active' : ''}`}
              onClick={() => navigateToView('saved')}
            >
              Saved Papers
            </button>
          </nav>
        </div>
        <ProfileDropdown
          profile={currentProfile}
          onLogout={handleLogout}
          onEditProfile={handleEditProfile}
        />
      </header>

        <div className="app-main">
          <div className="content-wrapper">
          {currentView === 'hub' && (
            <HubOverview onSelect={navigateToView} />
          )}
          {currentView === 'chat' && <Chat />}
          {currentView === 'compare' && <ResearchCompare />}
          {currentView === 'discover' && <Discover />}
          {currentView === 'saved' && <SavedPapers />}
          </div>
        </div>
      </div>
    </ProfileContext.Provider>
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
          currentProfile ? (
            <Navigate to="/app" replace />
          ) : (
            <div className="app login-route">
              <Login
                onLogin={handleLogin}
                currentUser={null}
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
      <Route path="/app/*" element={mainApp} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

interface HubOverviewProps {
  onSelect: (view: ViewType) => void;
}

function HubOverview({ onSelect }: HubOverviewProps) {
  const sections: Array<{ key: ViewType; title: string; copy: string; icon: string; accent: string }> = [
    { key: 'chat', title: 'Chat Workspace', copy: 'Ask questions, annotate findings, and let the assistant pull papers on demand.', icon: '💬', accent: '#efe7db' },
    { key: 'compare', title: 'Research Compare', copy: 'Check novelty, see similar work, and capture metrics for your idea.', icon: '🧠', accent: '#e8ecff' },
    { key: 'discover', title: 'Collaborate', copy: 'Find researchers, share prompts, and explore open collaboration calls.', icon: '🤝', accent: '#e8f7f1' },
    { key: 'saved', title: 'Saved Papers', copy: 'Revisit your starred papers and notes from across conversations.', icon: '📚', accent: '#f5f1e8' }
  ];

  return (
    <div className="hub-overview">
      <div className="hub-header">
        <p className="hub-pill">Workspace</p>
        <h2>Where do you want to start?</h2>
        <p>Pick a surface to jump into. Everything lives in the same Synapse account.</p>
      </div>
      <div className="hub-grid">
        {sections.map(section => (
          <button
            key={section.key}
            className="hub-card"
            style={{ backgroundColor: section.accent }}
            onClick={() => onSelect(section.key)}
          >
            <span className="hub-icon" aria-hidden>{section.icon}</span>
            <div>
              <h3>{section.title}</h3>
              <p>{section.copy}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

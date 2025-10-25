import { useState } from 'react';
import Chat from './components/Chat';
import { Profile } from './components/Profile';
import { Login } from './components/Login';
import './App.css';

function App() {
  const [showProfile, setShowProfile] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const handleLogin = (username: string) => {
    setCurrentUser(username);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">Synapse AI</h1>
          <nav className="app-nav">
            <button
              className={`nav-btn ${!showProfile ? 'active' : ''}`}
              onClick={() => setShowProfile(false)}
            >
              Chat
            </button>
            <button
              className={`nav-btn ${showProfile ? 'active' : ''}`}
              onClick={() => setShowProfile(true)}
            >
              Profile
            </button>
          </nav>
        </div>
        {currentUser && <div className="current-user">Logged in as {currentUser}</div>}
      </header>

      <div className="app-main">
        <div className="content-wrapper">
          {showProfile ? <Profile /> : <Chat />}
        </div>

        <Login
          onLogin={handleLogin}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      </div>
    </div>
  );
}

export default App;

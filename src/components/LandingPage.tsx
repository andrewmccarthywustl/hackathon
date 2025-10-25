import './LandingPage.css';

interface LandingPageProps {
  onGoogleLogin: () => void;
}

export function LandingPage({ onGoogleLogin }: LandingPageProps) {
  return (
    <div className="landing-page">
      <div className="landing-hero">
        <div className="hero-content">
          <h1 className="hero-title">Synapse AI</h1>
          <p className="hero-tagline">
            Your AI-powered research companion
          </p>
          <p className="hero-description">
            Connect with researchers, discover groundbreaking papers, and explore
            your field with intelligent assistance powered by advanced AI.
          </p>

          <button className="google-login-btn" onClick={onGoogleLogin}>
            <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className="privacy-note">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

        <div className="hero-stats">
          <div className="stat-card">
            <div className="stat-number">10K+</div>
            <div className="stat-label">Research Papers</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">5K+</div>
            <div className="stat-label">Active Researchers</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">100+</div>
            <div className="stat-label">Institutions</div>
          </div>
        </div>
      </div>

      <div className="features-section">
        <h2>Why Researchers Choose Synapse AI</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Smart Paper Discovery</h3>
            <p>Find relevant research papers with AI-powered search that understands context and research domains</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🤝</div>
            <h3>Connect with Peers</h3>
            <p>Discover and connect with researchers working in your field or related areas</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💡</div>
            <h3>Intelligent Insights</h3>
            <p>Get AI-powered summaries, analysis, and research trend identification</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Track Your Work</h3>
            <p>Manage your research interests and keep track of important papers and collaborations</p>
          </div>
        </div>
      </div>
    </div>
  );
}

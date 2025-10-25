import './LandingPage.css';
import { MathBackground } from './MathBackground';

interface LandingPageProps {
  onGoogleLogin: () => void;
}

export function LandingPage({ onGoogleLogin }: LandingPageProps) {
  return (
    <div className="landing-page">
      <MathBackground />
      <div className="landing-overlay">
        <div className="hero-content">
          <p className="hero-pill">Research Companion</p>
          <h1 className="hero-title">Synapse AI</h1>
          <p className="hero-description">
            A calm workspace for exploring new ideas, mapping prior art, and
            staying in flow with a curious co-pilot.
          </p>
          <button className="jump-btn" onClick={onGoogleLogin}>
            Start Your Journey
          </button>
        </div>
      </div>
    </div>
  );
}

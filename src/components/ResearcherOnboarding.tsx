import { useState } from 'react';
import type { ResearcherProfile } from '../types/profile';
import { apiUrl } from '../utils/api';
import './ResearcherOnboarding.css';

interface ResearcherOnboardingProps {
  googleEmail: string;
  googleName: string;
  onComplete: (profile: ResearcherProfile) => void;
}

const AVATAR_ICONS = [
  '👨‍🔬', '👩‍🔬', '🧑‍🔬',
  '👨‍💻', '👩‍💻', '🧑‍💻',
  '👨‍🎓', '👩‍🎓', '🧑‍🎓',
  '🧪', '🔬', '🧬',
  '🌟', '🚀', '💡',
  '📚', '🎯', '⚡'
];

export function ResearcherOnboarding({ googleEmail, googleName, onComplete }: ResearcherOnboardingProps) {
  const [profile, setProfile] = useState<Partial<ResearcherProfile>>({
    name: '',
    email: '',
    institution: '',
    department: '',
    researchInterests: [],
    bio: '',
    homepage: '',
    orcid: '',
    googleScholar: '',
    avatarIcon: ''
  });

  const [interestInput, setInterestInput] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (field: keyof ResearcherProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleIconSelect = (icon: string) => {
    setProfile(prev => ({ ...prev, avatarIcon: icon }));
  };

  const addResearchInterest = () => {
    if (interestInput.trim()) {
      setProfile(prev => ({
        ...prev,
        researchInterests: [...(prev.researchInterests || []), interestInput.trim()]
      }));
      setInterestInput('');
    }
  };

  const removeResearchInterest = (index: number) => {
    setProfile(prev => ({
      ...prev,
      researchInterests: prev.researchInterests?.filter((_, i) => i !== index) || []
    }));
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return profile.institution && profile.institution.trim() !== '';
    }
    if (currentStep === 2) {
      return (profile.researchInterests?.length || 0) > 0;
    }
    if (currentStep === 3) {
      return true; // Professional links are optional
    }
    if (currentStep === 4) {
      return profile.avatarIcon && profile.avatarIcon !== '';
    }
    return true;
  };

  const handleNext = () => {
    if (canProceed() && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!profile.name || !profile.email || !profile.institution) {
      alert('Please fill in required fields');
      return;
    }

    const completeProfile: ResearcherProfile = {
      name: profile.name,
      email: profile.email,
      institution: profile.institution,
      department: profile.department,
      researchInterests: profile.researchInterests || [],
      bio: profile.bio,
      homepage: profile.homepage,
      orcid: profile.orcid,
      googleScholar: profile.googleScholar,
      avatarIcon: profile.avatarIcon,
      createdAt: new Date().toISOString()
    };

    setIsSaving(true);

    try {
      const response = await fetch(apiUrl('/api/profile'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(completeProfile)
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      await response.json();
      onComplete(completeProfile);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
      setIsSaving(false);
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <h1>Welcome to Synapse AI</h1>
          <p>Let's set up your researcher profile</p>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
          <div className="step-indicator">
            Step {currentStep} of 4
          </div>
        </div>

        <div className="onboarding-content">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="step-content">
              <h2>Basic Information</h2>
              <p className="step-description">
                Tell us about your academic affiliation
              </p>

              <div className="form-group">
                <label>Name <span className="required">*</span></label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Your full name"
                />
              </div>

              <div className="form-group">
                <label>Email <span className="required">*</span></label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your.email@institution.edu"
                />
              </div>

              <div className="form-group">
                <label>
                  Institution <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={profile.institution}
                  onChange={(e) => handleInputChange('institution', e.target.value)}
                  placeholder="Your university or research institution"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  value={profile.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  placeholder="Department or Lab (optional)"
                />
              </div>
            </div>
          )}

          {/* Step 2: Research Interests */}
          {currentStep === 2 && (
            <div className="step-content">
              <h2>Research Interests</h2>
              <p className="step-description">
                Add topics that describe your research focus
              </p>

              <div className="form-group">
                <label>
                  Research Interests <span className="required">*</span>
                </label>
                <div className="interests-input">
                  <input
                    type="text"
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addResearchInterest())}
                    placeholder="e.g., Machine Learning, Quantum Computing"
                    autoFocus
                  />
                  <button type="button" onClick={addResearchInterest}>Add</button>
                </div>
                <div className="interests-list">
                  {profile.researchInterests?.map((interest, index) => (
                    <span key={index} className="interest-tag">
                      {interest}
                      <button onClick={() => removeResearchInterest(index)}>&times;</button>
                    </span>
                  ))}
                </div>
                {(profile.researchInterests?.length || 0) === 0 && (
                  <p className="help-text">Add at least one research interest to continue</p>
                )}
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Brief description of your research background and interests (optional)"
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 3: Professional Links */}
          {currentStep === 3 && (
            <div className="step-content">
              <h2>Professional Links</h2>
              <p className="step-description">
                Connect your academic profiles (all optional)
              </p>

              <div className="form-group">
                <label>Homepage URL</label>
                <input
                  type="url"
                  value={profile.homepage}
                  onChange={(e) => handleInputChange('homepage', e.target.value)}
                  placeholder="https://your-website.com"
                />
              </div>

              <div className="form-group">
                <label>ORCID</label>
                <input
                  type="text"
                  value={profile.orcid}
                  onChange={(e) => handleInputChange('orcid', e.target.value)}
                  placeholder="0000-0000-0000-0000"
                />
              </div>

              <div className="form-group">
                <label>Google Scholar URL</label>
                <input
                  type="url"
                  value={profile.googleScholar}
                  onChange={(e) => handleInputChange('googleScholar', e.target.value)}
                  placeholder="https://scholar.google.com/citations?user=..."
                />
              </div>
            </div>
          )}

          {/* Step 4: Avatar Selection */}
          {currentStep === 4 && (
            <div className="step-content">
              <h2>Choose Your Avatar</h2>
              <p className="step-description">
                Select an icon to represent your profile
              </p>

              <div className="avatar-preview">
                {profile.avatarIcon ? (
                  <span className="avatar-icon-large">{profile.avatarIcon}</span>
                ) : (
                  <div className="avatar-placeholder">?</div>
                )}
              </div>

              <div className="avatar-grid">
                {AVATAR_ICONS.map((icon, index) => (
                  <button
                    key={index}
                    className={`avatar-option ${profile.avatarIcon === icon ? 'selected' : ''}`}
                    onClick={() => handleIconSelect(icon)}
                    type="button"
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="onboarding-actions">
          <button
            className="btn-secondary"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            Back
          </button>

          {currentStep < 4 ? (
            <button
              className="btn-primary"
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Next
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Complete Setup'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

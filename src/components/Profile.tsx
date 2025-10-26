import { useState } from 'react';
import type { ResearcherProfile } from '../types/profile';
import { apiUrl } from '../utils/api';
import './Profile.css';

export function Profile() {
  const [profile, setProfile] = useState<Partial<ResearcherProfile>>({
    name: '',
    email: '',
    institution: '',
    department: '',
    researchInterests: [],
    bio: '',
    homepage: '',
    orcid: '',
    googleScholar: ''
  });

  const [interestInput, setInterestInput] = useState('');
  const [savedProfile, setSavedProfile] = useState<ResearcherProfile | null>(null);

  const handleInputChange = (field: keyof ResearcherProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
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

  const handleSaveProfile = async () => {
    if (!profile.name || !profile.email || !profile.institution) {
      alert('Please fill in required fields: Name, Email, and Institution');
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
      createdAt: new Date().toISOString()
    };

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

      const result = await response.json();
      setSavedProfile(completeProfile);
      alert('Profile saved successfully!');
      console.log('Profile saved:', result);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. See console for details.');
    }
  };

  const handleDownloadJSON = () => {
    if (!profile.name || !profile.email || !profile.institution) {
      alert('Please fill in required fields before downloading');
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
      createdAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(completeProfile, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `researcher-profile-${profile.name?.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="profile-container">
      <h2>Create Your Researcher Profile</h2>

      <div className="profile-form">
        <div className="form-group">
          <label>
            Name <span className="required">*</span>
          </label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Your full name"
          />
        </div>

        <div className="form-group">
          <label>
            Email <span className="required">*</span>
          </label>
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
          />
        </div>

        <div className="form-group">
          <label>Department</label>
          <input
            type="text"
            value={profile.department}
            onChange={(e) => handleInputChange('department', e.target.value)}
            placeholder="Department or Lab"
          />
        </div>

        <div className="form-group">
          <label>Research Interests</label>
          <div className="interests-input">
            <input
              type="text"
              value={interestInput}
              onChange={(e) => setInterestInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addResearchInterest()}
              placeholder="Add a research interest and press Enter"
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
        </div>

        <div className="form-group">
          <label>Bio</label>
          <textarea
            value={profile.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            placeholder="Brief description of your research background and interests"
            rows={4}
          />
        </div>

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

        <div className="button-group">
          <button className="save-button" onClick={handleSaveProfile}>
            Save Profile to Server
          </button>
          <button className="download-button" onClick={handleDownloadJSON}>
            Download as JSON
          </button>
        </div>

        {savedProfile && (
          <div className="success-message">
            Profile saved successfully! Created at {new Date(savedProfile.createdAt).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}

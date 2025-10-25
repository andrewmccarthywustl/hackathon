import { useState, useRef, useEffect } from 'react';
import type { ResearcherProfile } from '../types/profile';
import './ProfileDropdown.css';

interface ProfileDropdownProps {
  profile: ResearcherProfile | null;
  onLogout: () => void;
  onEditProfile: () => void;
}

export function ProfileDropdown({ profile, onLogout, onEditProfile }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!profile) return null;

  return (
    <div className="profile-dropdown" ref={dropdownRef}>
      <button
        className="profile-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Profile menu"
      >
        {profile.avatarIcon ? (
          <span className="profile-icon">{profile.avatarIcon}</span>
        ) : (
          <div className="profile-avatar">
            {getInitials(profile.name)}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          <div className="dropdown-header">
            {profile.avatarIcon ? (
              <span className="profile-icon-large">{profile.avatarIcon}</span>
            ) : (
              <div className="profile-avatar-large">
                {getInitials(profile.name)}
              </div>
            )}
            <div className="profile-info">
              <div className="profile-name">{profile.name}</div>
              <div className="profile-email">{profile.email}</div>
            </div>
          </div>

          <div className="dropdown-divider"></div>

          <div className="profile-details">
            <div className="detail-row">
              <span className="detail-label">Institution:</span>
              <span className="detail-value">{profile.institution}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Department:</span>
              <span className="detail-value">{profile.department}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Research Interests:</span>
              <span className="detail-value">{profile.researchInterests}</span>
            </div>
          </div>

          <div className="dropdown-divider"></div>

          <div className="dropdown-actions">
            <button className="dropdown-btn" onClick={() => { onEditProfile(); setIsOpen(false); }}>
              Edit Profile
            </button>
            <button className="dropdown-btn logout-btn" onClick={() => { onLogout(); setIsOpen(false); }}>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

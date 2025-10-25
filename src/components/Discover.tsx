import { useState } from 'react';
import './Discover.css';

interface Researcher {
  id: string;
  name: string;
  email: string;
  institution: string;
  department: string;
  researchInterests: string[];
  publications: number;
  avatar?: string;
}

// Mock researcher data
const MOCK_RESEARCHERS: Researcher[] = [
  {
    id: '1',
    name: 'Dr. Emily Chen',
    email: 'emily.chen@stanford.edu',
    institution: 'Stanford University',
    department: 'Computer Science',
    researchInterests: ['Machine Learning', 'Neural Networks', 'Computer Vision'],
    publications: 47,
  },
  {
    id: '2',
    name: 'Prof. Michael Rodriguez',
    email: 'm.rodriguez@mit.edu',
    institution: 'MIT',
    department: 'Artificial Intelligence Lab',
    researchInterests: ['Robotics', 'Reinforcement Learning', 'Autonomous Systems'],
    publications: 89,
  },
  {
    id: '3',
    name: 'Dr. Aisha Patel',
    email: 'aisha.patel@berkeley.edu',
    institution: 'UC Berkeley',
    department: 'Neuroscience',
    researchInterests: ['Computational Neuroscience', 'Brain-Computer Interfaces', 'Cognitive Science'],
    publications: 62,
  },
  {
    id: '4',
    name: 'Dr. James Liu',
    email: 'james.liu@caltech.edu',
    institution: 'Caltech',
    department: 'Physics',
    researchInterests: ['Quantum Computing', 'Quantum Information', 'Quantum Algorithms'],
    publications: 34,
  },
  {
    id: '5',
    name: 'Prof. Sarah Williams',
    email: 's.williams@oxford.ac.uk',
    institution: 'Oxford University',
    department: 'Molecular Biology',
    researchInterests: ['Genomics', 'CRISPR', 'Gene Therapy'],
    publications: 103,
  },
  {
    id: '6',
    name: 'Dr. Carlos Martinez',
    email: 'carlos.m@eth.ch',
    institution: 'ETH Zurich',
    department: 'Data Science',
    researchInterests: ['Big Data', 'Natural Language Processing', 'Information Retrieval'],
    publications: 56,
  },
  {
    id: '7',
    name: 'Dr. Lisa Anderson',
    email: 'l.anderson@harvard.edu',
    institution: 'Harvard University',
    department: 'Biomedical Engineering',
    researchInterests: ['Medical Imaging', 'AI in Healthcare', 'Diagnostic Systems'],
    publications: 71,
  },
  {
    id: '8',
    name: 'Prof. David Kim',
    email: 'd.kim@princeton.edu',
    institution: 'Princeton University',
    department: 'Chemistry',
    researchInterests: ['Materials Science', 'Nanotechnology', 'Energy Storage'],
    publications: 95,
  },
];

export function Discover() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null);

  // Get all unique research interests
  const allInterests = Array.from(
    new Set(MOCK_RESEARCHERS.flatMap(r => r.researchInterests))
  ).sort();

  // Filter researchers based on search and selected interest
  const filteredResearchers = MOCK_RESEARCHERS.filter(researcher => {
    const matchesSearch = searchTerm === '' ||
      researcher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      researcher.institution.toLowerCase().includes(searchTerm.toLowerCase()) ||
      researcher.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      researcher.researchInterests.some(interest =>
        interest.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesInterest = !selectedInterest ||
      researcher.researchInterests.includes(selectedInterest);

    return matchesSearch && matchesInterest;
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="discover-container">
      <div className="discover-header">
        <h2>Discover Researchers</h2>
        <p className="discover-subtitle">
          Connect with researchers from around the world
        </p>
      </div>

      <div className="discover-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name, institution, or research area..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="interest-filters">
          <button
            className={`interest-chip ${!selectedInterest ? 'active' : ''}`}
            onClick={() => setSelectedInterest(null)}
          >
            All Fields
          </button>
          {allInterests.map(interest => (
            <button
              key={interest}
              className={`interest-chip ${selectedInterest === interest ? 'active' : ''}`}
              onClick={() => setSelectedInterest(interest)}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>

      <div className="researchers-grid">
        {filteredResearchers.map(researcher => (
          <div key={researcher.id} className="researcher-card">
            <div className="researcher-avatar">
              {getInitials(researcher.name)}
            </div>
            <div className="researcher-info">
              <h3 className="researcher-name">{researcher.name}</h3>
              <p className="researcher-institution">{researcher.institution}</p>
              <p className="researcher-department">{researcher.department}</p>

              <div className="researcher-interests">
                {researcher.researchInterests.map(interest => (
                  <span key={interest} className="interest-tag">
                    {interest}
                  </span>
                ))}
              </div>

              <div className="researcher-stats">
                <span className="stat">
                  <strong>{researcher.publications}</strong> Publications
                </span>
              </div>

              <div className="researcher-actions">
                <button className="btn-contact">Contact</button>
                <button className="btn-view-profile">View Profile</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredResearchers.length === 0 && (
        <div className="no-results">
          <p>No researchers found matching your criteria.</p>
          <p>Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}

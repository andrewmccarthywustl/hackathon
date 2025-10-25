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
  bio: string;
  location: string;
  availability: string;
  collaborationFocus: string[];
  recentProjects: string[];
  lookingFor: string;
  preferredContact: string;
  officeHours: string;
}

interface CollaborationSpotlight {
  id: string;
  leadId: string;
  title: string;
  summary: string;
  needs: string[];
  timeline: string;
  priority: 'Open Call' | 'Urgent' | 'Exploratory';
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
    bio: 'Bridging differentiable rendering with neuromorphic sensors to understand scene dynamics at the millisecond scale.',
    location: 'Palo Alto, CA',
    availability: 'Co-leading projects starting Summer 2025',
    collaborationFocus: ['Neuromorphic vision for robotics', 'Self-supervised labelling pipelines'],
    recentProjects: [
      'Sparse-to-dense reconstruction toolkit for microscopy footage',
      'Contrastive pretraining pipeline for biomedical video datasets'
    ],
    lookingFor: 'Teams with high-resolution neural data or interest in co-authoring CVPR/NeurIPS submissions.',
    preferredContact: 'Intro email with 2 sentence abstract',
    officeHours: 'Thursdays 2-4pm PT'
  },
  {
    id: '2',
    name: 'Prof. Michael Rodriguez',
    email: 'm.rodriguez@mit.edu',
    institution: 'MIT',
    department: 'Artificial Intelligence Lab',
    researchInterests: ['Robotics', 'Reinforcement Learning', 'Autonomous Systems'],
    publications: 89,
    bio: 'Runs the Human-Centered Autonomy lab focusing on sim2real transfer for embodied agents in shared workspaces.',
    location: 'Cambridge, MA',
    availability: 'Looking for collaborators Q3-Q4 2025',
    collaborationFocus: ['Multi-agent curriculum design', 'Safety constraints for co-bots'],
    recentProjects: [
      'Policy distillation framework for shared autonomy',
      'Edge deployment toolkit for low-power manipulators'
    ],
    lookingFor: 'Industrial partners with access to real-world manipulation data and evaluation facilities.',
    preferredContact: 'Short Loom + email',
    officeHours: 'Mondays 11-1pm ET'
  },
  {
    id: '3',
    name: 'Dr. Aisha Patel',
    email: 'aisha.patel@berkeley.edu',
    institution: 'UC Berkeley',
    department: 'Neuroscience',
    researchInterests: ['Computational Neuroscience', 'Brain-Computer Interfaces', 'Cognitive Science'],
    publications: 62,
    bio: 'Models learning in motor cortex using hybrid graph neural networks + calcium imaging datasets.',
    location: 'Berkeley, CA',
    availability: 'Open to new data swaps in May 2025',
    collaborationFocus: ['Closed-loop BCI experiments', 'Graph decoding architectures'],
    recentProjects: [
      'Open-source motor intention dataset with simultaneous neural + kinematic readouts',
      'Transformer decoders for rapid prosthetic adaptation'
    ],
    lookingFor: 'Clinicians or labs running non-invasive BCIs needing decoding expertise.',
    preferredContact: 'Signal message or email',
    officeHours: 'Fridays 9-11am PT'
  },
  {
    id: '4',
    name: 'Dr. James Liu',
    email: 'james.liu@caltech.edu',
    institution: 'Caltech',
    department: 'Physics',
    researchInterests: ['Quantum Computing', 'Quantum Information', 'Quantum Algorithms'],
    publications: 34,
    bio: 'Builds hybrid photonic-superconducting testbeds for near-term error mitigation studies.',
    location: 'Pasadena, CA',
    availability: 'Light availability through Fall 2025',
    collaborationFocus: ['Benchmark suites for quantum chemistry', 'Pulse-level compilation'],
    recentProjects: [
      'Variational ansatz search library for materials science',
      'Noise-aware transpiler for 50-qubit hardware'
    ],
    lookingFor: 'Chemistry groups needing co-development of quantum workflows and dataset sharing.',
    preferredContact: 'Calendly intro call',
    officeHours: 'Wednesdays 1-3pm PT'
  },
  {
    id: '5',
    name: 'Prof. Sarah Williams',
    email: 's.williams@oxford.ac.uk',
    institution: 'Oxford University',
    department: 'Molecular Biology',
    researchInterests: ['Genomics', 'CRISPR', 'Gene Therapy'],
    publications: 103,
    bio: 'Leads a wet lab translating CRISPR screens into patient-specific gene therapy protocols.',
    location: 'Oxford, UK',
    availability: 'Lab visits September onwards',
    collaborationFocus: ['In vivo delivery', 'High-throughput validation'],
    recentProjects: [
      'Guide RNA ranking model deployed for oncology partners',
      'Closed-loop CRISPR screening workflow'
    ],
    lookingFor: 'Computational partners to help prioritize targets + automate design reviews.',
    preferredContact: 'Email with slide deck',
    officeHours: 'Tuesdays 10-12pm GMT'
  },
  {
    id: '6',
    name: 'Dr. Carlos Martinez',
    email: 'carlos.m@eth.ch',
    institution: 'ETH Zurich',
    department: 'Data Science',
    researchInterests: ['Big Data', 'Natural Language Processing', 'Information Retrieval'],
    publications: 56,
    bio: 'Designs multilingual retrieval systems for scientific corpora with fairness constraints.',
    location: 'Zurich, Switzerland',
    availability: 'Hackathon sprints April-June',
    collaborationFocus: ['LLM evaluation tooling', 'Scientific agent assistants'],
    recentProjects: [
      'Citation graph completion service used by 12 labs',
      'Dataset curation assistant for low-resource languages'
    ],
    lookingFor: 'Applied ML teams who can stress-test multilingual retrieval benchmarks.',
    preferredContact: 'Matrix/Email hybrid',
    officeHours: 'CET afternoons by appointment'
  },
  {
    id: '7',
    name: 'Dr. Lisa Anderson',
    email: 'l.anderson@harvard.edu',
    institution: 'Harvard University',
    department: 'Biomedical Engineering',
    researchInterests: ['Medical Imaging', 'AI in Healthcare', 'Diagnostic Systems'],
    publications: 71,
    bio: 'Ships FDA-ready computer vision models for low-resource health systems.',
    location: 'Boston, MA',
    availability: 'Clinical pilots starting July 2025',
    collaborationFocus: ['Ultrasound automation', 'Federated training'],
    recentProjects: [
      'Edge AI pipeline for handheld ultrasound devices',
      'Federated diagnostic model across 9 hospitals'
    ],
    lookingFor: 'Hospitals or NGOs with de-identified scans willing to join federated studies.',
    preferredContact: 'Secure email + DUA template',
    officeHours: 'Mondays 8-10am ET'
  },
  {
    id: '8',
    name: 'Prof. David Kim',
    email: 'd.kim@princeton.edu',
    institution: 'Princeton University',
    department: 'Chemistry',
    researchInterests: ['Materials Science', 'Nanotechnology', 'Energy Storage'],
    publications: 95,
    bio: 'Runs an energy storage lab exploring solid-state electrolytes and AI-guided synthesis.',
    location: 'Princeton, NJ',
    availability: 'Joint grant proposals in 2025 cycle',
    collaborationFocus: ['Battery lifetime prediction', 'High-throughput experimentation'],
    recentProjects: [
      'Self-driving lab prototype for electrolyte blending',
      'Diffusion model for materials property forecasting'
    ],
    lookingFor: 'ML teams to accelerate hypothesis selection + share lab robotics know-how.',
    preferredContact: 'Email or Slack connect',
    officeHours: 'Fridays 2-4pm ET'
  },
];

const COLLAB_SPOTLIGHTS: CollaborationSpotlight[] = [
  {
    id: 'spot-gan-neuro',
    leadId: '3',
    title: 'Closed-loop GANs for neuron reconstruction',
    summary: 'Pairing adversarial decoders with calcium imaging rigs to reconstruct neuron morphology in real time.',
    needs: ['GAN expertise', 'Neural data QA', 'High-speed GPUs'],
    timeline: 'Kickoff June 2025',
    priority: 'Urgent'
  },
  {
    id: 'spot-quantum',
    leadId: '4',
    title: 'Quantum pulse compiler for chemistry workloads',
    summary: 'Collaborative push to ship a pulse-level transpiler tuned for 40-60 qubit noisy devices.',
    needs: ['Pulse optimization', 'Quantum chemistry benchmarks', 'Rust devs'],
    timeline: 'Pilot Q3 2025',
    priority: 'Open Call'
  },
  {
    id: 'spot-medimg',
    leadId: '7',
    title: 'Federated ultrasound triage network',
    summary: 'Seeking clinics to join a privacy-preserving training cohort for handheld ultrasound diagnostics.',
    needs: ['De-identified scans', 'Federated infra', 'Clinical validation'],
    timeline: 'Recruiting now',
    priority: 'Exploratory'
  },
];

export function Discover() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null);
  const [profileResearcher, setProfileResearcher] = useState<Researcher | null>(null);
  const [contactResearcher, setContactResearcher] = useState<Researcher | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

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

  const openProfile = (researcher: Researcher) => {
    setProfileResearcher(researcher);
  };

  const openContact = (researcher: Researcher) => {
    setContactResearcher(researcher);
    setCopiedEmail(null);
  };

  const closeProfile = () => setProfileResearcher(null);
  const closeContact = () => {
    setContactResearcher(null);
    setCopiedEmail(null);
  };

  const handleCopyEmail = async () => {
    if (contactResearcher?.email && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(contactResearcher.email);
        setCopiedEmail(contactResearcher.email);
        setTimeout(() => setCopiedEmail(null), 2000);
      } catch (error) {
        console.warn('Clipboard unavailable', error);
      }
    }
  };

  const handleRequestIntro = (leadId: string) => {
    const lead = MOCK_RESEARCHERS.find(r => r.id === leadId);
    if (lead) {
      openContact(lead);
    }
  };

  const contactTemplate = contactResearcher
    ? `Hi ${contactResearcher.name.split(' ')[0]},\n\nI found your collaboration request on Synapse AI and would love to explore ways we could help with ${contactResearcher.collaborationFocus[0].toLowerCase()}.\n\nWould you be open to a quick call during ${contactResearcher.officeHours}?\n\nThanks!`
    : '';

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

      <div className="collab-spotlights">
        <div className="spotlights-header">
          <div>
            <p className="spotlights-label">Collaboration board</p>
            <h3>Active requests looking for partners</h3>
          </div>
          <span className="spotlights-total">{COLLAB_SPOTLIGHTS.length} open invites</span>
        </div>
        <div className="spotlight-grid">
          {COLLAB_SPOTLIGHTS.map((spotlight) => {
            const lead = MOCK_RESEARCHERS.find(r => r.id === spotlight.leadId);
            const priorityClass = spotlight.priority.toLowerCase().replace(/\s+/g, '-');
            return (
              <div key={spotlight.id} className="spotlight-card">
                <div className={`spotlight-pill ${priorityClass}`}>
                  {spotlight.priority}
                </div>
                <h4>{spotlight.title}</h4>
                <p className="spotlight-summary">{spotlight.summary}</p>
                <div className="spotlight-row">
                  <span className="spotlight-label">Needs</span>
                  <div className="spotlight-tags">
                    {spotlight.needs.map(need => (
                      <span key={need}>{need}</span>
                    ))}
                  </div>
                </div>
                <div className="spotlight-row">
                  <span className="spotlight-label">Timeline</span>
                  <p>{spotlight.timeline}</p>
                </div>
                {lead && (
                  <div className="spotlight-lead">
                    <div>
                      <p className="lead-label">Lead</p>
                      <p className="lead-name">{lead.name}</p>
                    </div>
                    <button onClick={() => handleRequestIntro(spotlight.leadId)}>Request intro</button>
                  </div>
                )}
              </div>
            );
          })}
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
                <button className="btn-contact" onClick={() => openContact(researcher)}>Contact</button>
                <button className="btn-view-profile" onClick={() => openProfile(researcher)}>View Profile</button>
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

      {profileResearcher && (
        <div className="discover-modal-overlay" onClick={closeProfile}>
          <div className="discover-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeProfile}>×</button>
            <div className="modal-header">
              <div className="modal-avatar">{getInitials(profileResearcher.name)}</div>
              <div>
                <h3>{profileResearcher.name}</h3>
                <p>{profileResearcher.institution} · {profileResearcher.department}</p>
              </div>
            </div>
            <div className="modal-pills">
              <span>{profileResearcher.location}</span>
              <span>{profileResearcher.availability}</span>
            </div>
            <p className="modal-bio">{profileResearcher.bio}</p>
            <div className="modal-section">
              <h4>Collaboration focus</h4>
              <ul>
                {profileResearcher.collaborationFocus.map(focus => (
                  <li key={focus}>{focus}</li>
                ))}
              </ul>
            </div>
            <div className="modal-section">
              <h4>Recent wins</h4>
              <ul>
                {profileResearcher.recentProjects.map(project => (
                  <li key={project}>{project}</li>
                ))}
              </ul>
            </div>
            <div className="modal-section">
              <h4>Currently looking for</h4>
              <p>{profileResearcher.lookingFor}</p>
            </div>
            <div className="modal-footer">
              <button onClick={() => {
                closeProfile();
                openContact(profileResearcher);
              }}>
                Contact {profileResearcher.name.split(' ')[0]}
              </button>
            </div>
          </div>
        </div>
      )}

      {contactResearcher && (
        <div className="discover-modal-overlay" onClick={closeContact}>
          <div className="discover-modal contact" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeContact}>×</button>
            <h3>Contact {contactResearcher.name}</h3>
            <p className="contact-subtitle">Preferred: {contactResearcher.preferredContact}</p>
            <div className="contact-card">
              <div className="contact-row">
                <div>
                  <p className="contact-label">Email</p>
                  <p className="contact-value">{contactResearcher.email}</p>
                </div>
                <button className="copy-btn" onClick={handleCopyEmail}>
                  {copiedEmail ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="contact-row">
                <div>
                  <p className="contact-label">Office hours</p>
                  <p className="contact-value">{contactResearcher.officeHours}</p>
                </div>
                <div>
                  <p className="contact-label">Focus right now</p>
                  <p className="contact-value">{contactResearcher.collaborationFocus[0]}</p>
                </div>
              </div>
            </div>
            <div className="contact-template">
              <label htmlFor="intro-template">Suggested intro message</label>
              <textarea id="intro-template" readOnly value={contactTemplate} />
            </div>
            <div className="contact-actions">
              <button onClick={closeContact}>Close</button>
              <a className="contact-primary" href={`mailto:${contactResearcher.email}?subject=Collaboration%20interest`}>
                Open email draft
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

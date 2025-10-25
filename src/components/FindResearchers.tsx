import { useState } from 'react';
import type { ArxivPaper } from '../types';
import PaperCard from './PaperCard';

const API_BASE = '/api';

export default function FindResearchers() {
  const [interests, setInterests] = useState('');
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [papers, setPapers] = useState<ArxivPaper[]>([]);

  const findResearchers = async () => {
    if (!interests.trim()) {
      alert('Please enter at least one research interest');
      return;
    }

    setLoading(true);
    const interestsList = interests.split(',').map(s => s.trim()).filter(Boolean);
    const keywordsList = keywords.split(',').map(s => s.trim()).filter(Boolean);

    try {
      const response = await fetch(`${API_BASE}/find-researchers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interests: interestsList,
          keywords: keywordsList.length > 0 ? keywordsList : undefined
        })
      });

      const data = await response.json();

      if (response.ok) {
        setAnalysis(data.analysis);
        setPapers(data.relatedPapers || []);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to find researchers. Please try again.');
      console.error('Find researchers error:', error);
    }

    setLoading(false);
  };

  return (
    <div className="form-container">
      <h2>Find Researchers in Your Field</h2>

      <div className="form-group">
        <label htmlFor="interests">Research Interests (comma-separated):</label>
        <input
          id="interests"
          type="text"
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
          placeholder="machine learning, quantum computing, bioinformatics"
        />
      </div>

      <div className="form-group">
        <label htmlFor="keywords">Keywords (optional, comma-separated):</label>
        <input
          id="keywords"
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="neural networks, optimization, proteins"
        />
      </div>

      <button onClick={findResearchers} disabled={loading} className="action-btn">
        {loading ? 'Searching...' : 'Find Researchers'}
      </button>

      {analysis && (
        <div className="results">
          <h3>AI Analysis</h3>
          <div className="analysis-text">{analysis}</div>

          {papers.length > 0 && (
            <>
              <h3>Related Papers</h3>
              <div className="papers-grid">
                {papers.map(paper => (
                  <PaperCard key={paper.id} paper={paper} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

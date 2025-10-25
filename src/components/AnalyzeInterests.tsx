import { useState } from 'react';
import type { ArxivPaper } from '../types';
import PaperCard from './PaperCard';

const API_BASE = '/api';

export default function AnalyzeInterests() {
  const [interests, setInterests] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [papers, setPapers] = useState<ArxivPaper[]>([]);

  const analyzeInterests = async () => {
    if (!interests.trim()) {
      alert('Please enter at least one research interest');
      return;
    }

    setLoading(true);
    const interestsList = interests.split(',').map(s => s.trim()).filter(Boolean);

    try {
      const response = await fetch(`${API_BASE}/analyze-interests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interests: interestsList })
      });

      const data = await response.json();

      if (response.ok) {
        setAnalysis(data.analysis);
        setPapers(data.relatedPapers || []);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Failed to analyze interests. Please try again.');
      console.error('Analyze interests error:', error);
    }

    setLoading(false);
  };

  return (
    <div className="form-container">
      <h2>Analyze Your Research Interests</h2>

      <div className="form-group">
        <label htmlFor="analyzeInterests">Research Interests (comma-separated):</label>
        <input
          id="analyzeInterests"
          type="text"
          value={interests}
          onChange={(e) => setInterests(e.target.value)}
          placeholder="computer vision, deep learning, autonomous systems"
        />
      </div>

      <button onClick={analyzeInterests} disabled={loading} className="action-btn">
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>

      {analysis && (
        <div className="results">
          <h3>Analysis</h3>
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

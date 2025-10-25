import { useState, useEffect } from 'react';
import { savedPapersStorage, type SavedPaper } from '../utils/savedPapersStorage';
import PaperCard from './PaperCard';
import './SavedPapers.css';

export function SavedPapers() {
  const [savedPapers, setSavedPapers] = useState<SavedPaper[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadSavedPapers();

    // Listen for storage events (in case papers are saved/removed in another tab)
    const handleStorageChange = () => {
      loadSavedPapers();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loadSavedPapers = () => {
    setSavedPapers(savedPapersStorage.getAll());
  };

  const filteredPapers = savedPapers.filter(paper =>
    searchTerm === '' ||
    paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    paper.authors.some(author => author.toLowerCase().includes(searchTerm.toLowerCase())) ||
    paper.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleClearAll = () => {
    if (confirm(`Are you sure you want to remove all ${savedPapers.length} saved papers?`)) {
      savedPapersStorage.clearAll();
      setSavedPapers([]);
    }
  };

  return (
    <div className="saved-papers-container">
      <div className="saved-papers-header">
        <div className="header-content">
          <h2>Saved Papers</h2>
          <p className="saved-count">{savedPapers.length} paper{savedPapers.length !== 1 ? 's' : ''} saved</p>
        </div>

        {savedPapers.length > 0 && (
          <button className="clear-all-btn" onClick={handleClearAll}>
            Clear All
          </button>
        )}
      </div>

      {savedPapers.length > 0 && (
        <div className="search-box">
          <input
            type="text"
            placeholder="Search saved papers by title, author, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      )}

      <div className="saved-papers-content">
        {savedPapers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>No saved papers yet</h3>
            <p>Papers you save during your research conversations will appear here.</p>
            <p>Click the star icon (☆) on any paper to save it for later!</p>
          </div>
        ) : filteredPapers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No papers match your search</h3>
            <p>Try different keywords or clear your search</p>
          </div>
        ) : (
          <div className="papers-grid">
            {filteredPapers.map(paper => (
              <div key={paper.id} className="saved-paper-item">
                <div className="saved-date">
                  Saved {new Date(paper.savedAt).toLocaleDateString()}
                </div>
                <PaperCard paper={paper} chatId={paper.chatId} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

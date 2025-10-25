import { useState, useEffect } from 'react';
import type { ArxivPaper } from '../types';
import { savedPapersStorage } from '../utils/savedPapersStorage';
import './PaperCard.css';

interface PaperCardProps {
  paper: ArxivPaper;
  chatId?: string;
}

export default function PaperCard({ paper, chatId }: PaperCardProps) {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setIsSaved(savedPapersStorage.isSaved(paper.id));
  }, [paper.id]);

  const handleClick = () => {
    if (paper.pdfLink) {
      window.open(paper.pdfLink, '_blank', 'noopener,noreferrer');
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaved) {
      savedPapersStorage.remove(paper.id);
      setIsSaved(false);
    } else {
      savedPapersStorage.save(paper, chatId);
      setIsSaved(true);
    }
  };

  return (
    <div
      className="paper-card"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <button
        className={`save-btn ${isSaved ? 'saved' : ''}`}
        onClick={handleSave}
        title={isSaved ? 'Unsave paper' : 'Save paper'}
        aria-label={isSaved ? 'Unsave paper' : 'Save paper'}
      >
        {isSaved ? '★' : '☆'}
      </button>

      <h4>{paper.title}</h4>
      <div className="authors">
        {paper.authors.slice(0, 3).join(', ')}
        {paper.authors.length > 3 ? ' et al.' : ''}
      </div>
      <div className="metadata">
        <span className="year">{paper.published.split('-')[0]}</span>
        {paper.categories.length > 0 && (
          <span className="categories">{paper.categories.slice(0, 2).join(', ')}</span>
        )}
      </div>
      <div className="paper-link-icon">
        📄 View Paper
      </div>
    </div>
  );
}

import type { ArxivPaper } from '../types';
import './PaperCard.css';

interface PaperCardProps {
  paper: ArxivPaper;
}

export default function PaperCard({ paper }: PaperCardProps) {
  const handleClick = () => {
    if (paper.pdfLink) {
      window.open(paper.pdfLink, '_blank', 'noopener,noreferrer');
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

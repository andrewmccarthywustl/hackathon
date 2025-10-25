import type { ArxivPaper } from '../types';
import './PaperCard.css';

interface PaperCardProps {
  paper: ArxivPaper;
}

export default function PaperCard({ paper }: PaperCardProps) {
  return (
    <div className="paper-card">
      <h4>{paper.title}</h4>
      <div className="authors">
        {paper.authors.slice(0, 5).join(', ')}
        {paper.authors.length > 5 ? ' et al.' : ''}
      </div>
      <div className="summary">
        {paper.summary.slice(0, 300)}...
      </div>
      <div className="categories">
        {paper.categories.join(', ')}
      </div>
      {paper.pdfLink && (
        <a href={paper.pdfLink} target="_blank" rel="noopener noreferrer" className="pdf-link">
          View PDF
        </a>
      )}
    </div>
  );
}

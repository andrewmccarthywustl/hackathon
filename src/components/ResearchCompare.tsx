import { useEffect, useMemo, useRef, useState } from 'react';
import type { JSX } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ArxivPaper } from '../types';
import PaperCard from './PaperCard';
import { apiUrl } from '../utils/api';
import './ResearchCompare.css';

const LOADING_PHASES = [
  {
    key: 'ingest',
    label: 'Parsing submission',
    detail: 'Cleaning text and extracting key entities',
    target: 18,
  },
  {
    key: 'concepts',
    label: 'Modeling core concepts',
    detail: 'Detecting field, goals, and novelty cues',
    target: 33,
  },
  {
    key: 'search',
    label: 'Searching arXiv + embeddings',
    detail: 'Running hybrid keyword and semantic search',
    target: 52,
  },
  {
    key: 'compare',
    label: 'Comparing overlaps',
    detail: 'Clustering similar claims and methods',
    target: 70,
  },
  {
    key: 'metrics',
    label: 'Scoring novelty + maturity',
    detail: 'Calculating timeline and activity metrics',
    target: 88,
  },
  {
    key: 'report',
    label: 'Writing summary + advice',
    detail: 'Compiling recommendations for you',
    target: 97,
  },
] as const;

const LOADING_TICKER = [
  'Indexing citations and topical keywords...',
  'Mapping semantic fingerprints against arXiv...',
  'Ranking overlapping approaches and baselines...',
  'Checking publication velocity over the last year...',
  'Scoring novelty vs. saturation...',
  'Drafting takeaways and recommended pivots...'
];

interface ResearchMetrics {
  noveltyScore: number;
  researchStartYear: string;
  papersLastYear: number;
  researchMaturity: string;
}

// Keeping this for backward compatibility with non-streaming endpoint
// interface ResearchCompareResponse {
//   analysis: string;
//   summary?: string;
//   similarPapers?: ArxivPaper[];
//   metrics?: ResearchMetrics | null;
// }

interface ResearchHistoryEntry {
  id: string;
  createdAt: string;
  inputPreview: string;
  summary: string;
  analysis: string;
  metrics: ResearchMetrics | null;
  similarPapers: ArxivPaper[];
}

interface OutlineItem {
  id: string;
  label: string;
  level: number;
}

const HISTORY_STORAGE_KEY = 'synapse-research-compare-history';
const MAX_HISTORY_ITEMS = 15;

export function ResearchCompare() {
  const [researchText, setResearchText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [analysis, setAnalysis] = useState('');
  const [summary, setSummary] = useState('');
  const [similarPapers, setSimilarPapers] = useState<ArxivPaper[]>([]);
  const [metrics, setMetrics] = useState<ResearchMetrics | null>(null);
  const [error, setError] = useState('');
  const [activePhase, setActivePhase] = useState(0);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [history, setHistory] = useState<ResearchHistoryEntry[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [outline, setOutline] = useState<OutlineItem[]>([]);

  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef(0);

  const clearLoadingIntervals = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (tickerIntervalRef.current) {
      clearInterval(tickerIntervalRef.current);
      tickerIntervalRef.current = null;
    }
  };

  // Removed fake animation - now using real progress from backend stream

  const resetLoadingIndicators = () => {
    phaseRef.current = 0;
    setActivePhase(0);
    setLoadingMessageIndex(0);
    setLoadingProgress(0);
  };

  useEffect(() => {
    return () => {
      clearLoadingIntervals();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ResearchHistoryEntry[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistory(parsed);
          applyHistoryEntry(parsed[0]);
        }
      }
    } catch (storageError) {
      console.warn('Unable to load research compare history', storageError);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (storageError) {
      console.warn('Unable to persist research compare history', storageError);
    }
  }, [history]);

  useEffect(() => {
    setOutline(generateOutline(analysis));
  }, [analysis]);

  const handleAnalyze = async () => {
    if (!researchText.trim()) {
      setError('Please provide some detail about your research');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setAnalysis('');
    setSummary('');
    setSimilarPapers([]);
    setMetrics(null);
    clearLoadingIntervals();
    resetLoadingIndicators();

    try {
      const formData = new FormData();
      formData.append('text', researchText);

      const response = await fetch(apiUrl('/api/compare-research-stream'), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to start analysis');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Stream not available');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'progress') {
                setLoadingProgress(data.progress);

                // Map progress to phases
                const phaseIndex = LOADING_PHASES.findIndex(p => data.progress < p.target);
                if (phaseIndex >= 0) {
                  setActivePhase(phaseIndex);
                  phaseRef.current = phaseIndex;
                } else {
                  setActivePhase(LOADING_PHASES.length - 1);
                  phaseRef.current = LOADING_PHASES.length - 1;
                }
              } else if (data.type === 'complete') {
                setLoadingProgress(100);
                setActivePhase(LOADING_PHASES.length - 1);

                // Brief pause to show 100% before displaying results
                await new Promise(resolve => setTimeout(resolve, 350));

                const result = data.data;
                setAnalysis(result.analysis || '');
                setSummary(result.summary || '');
                setSimilarPapers(result.similarPapers || []);
                setMetrics(result.metrics ?? null);

                const trimmedInput = researchText.trim();
                const newEntry: ResearchHistoryEntry = {
                  id: `${Date.now()}`,
                  createdAt: new Date().toISOString(),
                  inputPreview: trimmedInput.slice(0, 180) + (trimmedInput.length > 180 ? '…' : ''),
                  summary: result.summary || '',
                  analysis: result.analysis || '',
                  metrics: result.metrics ?? null,
                  similarPapers: result.similarPapers || [],
                };

                setHistory((prev) => {
                  const updated = [newEntry, ...prev];
                  return updated.slice(0, MAX_HISTORY_ITEMS);
                });
                setActiveHistoryId(newEntry.id);
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE message:', parseError);
            }
          }
        }
      }
    } catch (err) {
      clearLoadingIntervals();
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setIsAnalyzing(false);
      resetLoadingIndicators();
    }
  };

  const handleClear = () => {
    setResearchText('');
    setAnalysis('');
    setSummary('');
    setSimilarPapers([]);
    setMetrics(null);
    setError('');
    setActiveHistoryId(null);
  };

  const getNoveltyLabel = (score: number) => {
    if (score >= 7) return { text: 'Highly Novel', color: '#10b981' };
    if (score >= 4) return { text: 'Moderately Novel', color: '#f59e0b' };
    return { text: 'Well-Established', color: '#ef4444' };
  };

  const getMaturityColor = (maturity: string) => {
    switch (maturity.toLowerCase()) {
      case 'emerging': return '#10b981';
      case 'growing': return '#3b82f6';
      case 'mature': return '#f59e0b';
      case 'declining': return '#ef4444';
      default: return '#6b6558';
    }
  };

  function applyHistoryEntry(entry: ResearchHistoryEntry, updateHistoryId: boolean = true) {
    setAnalysis(entry.analysis);
    setSummary(entry.summary);
    setSimilarPapers(entry.similarPapers);
    setMetrics(entry.metrics);
    if (updateHistoryId) {
      setActiveHistoryId(entry.id);
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return 'Unknown date';
    }
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const clearHistory = () => {
    setHistory([]);
    setActiveHistoryId(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    }
  };

  const tickerMessage = LOADING_TICKER[loadingMessageIndex] ?? LOADING_TICKER[0];
  const cleanedSummary = summary
    .split('\n')
    .filter((line) => line.trim() !== '}')
    .join('\n')
    .trim();

  const analysisMarkdownComponents = useMemo(() => {
    let headingIndex = 0;
    const renderHeading = (tag: 'h1' | 'h2' | 'h3') => {
      return ({ node, ...props }: any) => {
        const currentId = outline[headingIndex]?.id;
        headingIndex += 1;
        const Tag = tag as keyof JSX.IntrinsicElements;
        return <Tag id={currentId} {...props} />;
      };
    };
    return {
      h1: renderHeading('h1'),
      h2: renderHeading('h2'),
      h3: renderHeading('h3')
    };
  }, [outline]);

  const scrollToSection = (id: string) => {
    if (typeof document === 'undefined') return;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="research-compare-container">
      <div className="compare-intro">
        <div className="research-compare-header">
          <h2>Research Comparison Tool</h2>
          <p className="research-compare-subtitle">
            Describe your research idea or upload a document, and we'll help you find similar existing research
            to avoid duplication and discover related work.
          </p>
        </div>

        <div className="input-section">
          <div className="text-input-section">
            <label htmlFor="research-text">Describe Your Research Idea</label>
            <textarea
              id="research-text"
              className="research-textarea"
              placeholder="Describe your research question, methodology, goals, or paste an abstract..."
              value={researchText}
              onChange={(e) => setResearchText(e.target.value)}
              rows={8}
              disabled={isAnalyzing}
            />
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="action-buttons">
          <button
            className="analyze-btn"
            onClick={handleAnalyze}
            disabled={isAnalyzing || !researchText.trim()}
          >
            {isAnalyzing ? 'Analyzing...' : 'Find Similar Research'}
          </button>
          {(analysis || similarPapers.length > 0) && (
            <button className="clear-btn" onClick={handleClear} disabled={isAnalyzing}>
              Clear Results
            </button>
          )}
        </div>
      </div>

      <div className="compare-layout">
        {outline.length > 0 && (
          <aside className="outline-panel">
            <div className="outline-panel-header">
              <p className="outline-label">Analysis outline</p>
              <h4>Jump to sections</h4>
            </div>
            <div className="outline-count-chip">{outline.length} heading{outline.length === 1 ? '' : 's'}</div>
            <div className="outline-scroll">
              <div className="outline-list">
                {outline.map((item) => (
                  <button
                    key={item.id}
                    className={`outline-item level-${item.level}`}
                    onClick={() => scrollToSection(item.id)}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}
        <div className="compare-main">
          {isAnalyzing && (
            <div className="loading-section">
              <div className="loading-header">
                <div className="loading-icon">🔍</div>
                <div className="loading-text">
                  <h3>Analyzing Your Research Idea</h3>
                  <p>Searching arXiv database and comparing with existing research...</p>
                </div>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${loadingProgress}%` }}
                  />
                </div>
                <div className="progress-text">{Math.round(loadingProgress)}%</div>
              </div>
              <div className="loading-ticker">
                <span className="ticker-dot" />
                <span className="ticker-text">{tickerMessage}</span>
              </div>
              <div className="loading-steps">
                {LOADING_PHASES.map((phase, index) => {
                  const isCompleted = index < activePhase;
                  const isActive = index === activePhase;
                  return (
                    <div
                      key={phase.key}
                      className={`loading-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                    >
                      <span className="step-icon">{isCompleted ? '✓' : isActive ? '●' : '○'}</span>
                      <div className="step-copy">
                        <span className="step-text">{phase.label}</span>
                        <span className="step-subtext">{phase.detail}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {analysis && !isAnalyzing && (
            <div className="results-section">
          {cleanedSummary && (
            <div className="summary-card">
              <div className="summary-card-header">
                <div className="summary-icon">🧠</div>
                <div>
                  <p className="summary-label">Quick verdict</p>
                  <h3>What the model found</h3>
                </div>
              </div>
              <div className="summary-body markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {cleanedSummary}
                </ReactMarkdown>
              </div>
            </div>
          )}

              {metrics && metrics.noveltyScore > 0 && (
                <div className="metrics-highlight">
                  <div className="metric-highlight-card">
                    <div className="metric-highlight-icon">🎯</div>
                    <div className="metric-highlight-content">
                      <div className="metric-highlight-label">Novelty Score</div>
                      <div className="metric-highlight-value">
                        <span className="score-number-large">{metrics.noveltyScore}</span>
                        <span className="score-max-large">/10</span>
                      </div>
                      <div
                        className="metric-highlight-badge"
                        style={{ backgroundColor: getNoveltyLabel(metrics.noveltyScore).color }}
                      >
                        {getNoveltyLabel(metrics.noveltyScore).text}
                      </div>
                    </div>
                  </div>

                  <div className="metric-highlight-card">
                    <div className="metric-highlight-icon">📅</div>
                    <div className="metric-highlight-content">
                      <div className="metric-highlight-label">Research Timeline</div>
                      <div className="metric-highlight-value">{metrics.researchStartYear}</div>
                      <div className="metric-highlight-subtext">
                        {metrics.researchStartYear !== 'Unknown' &&
                         metrics.researchStartYear !== 'Recent' &&
                         `${new Date().getFullYear() - parseInt(metrics.researchStartYear)} years of research`}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="analysis-section">
                <h3>Detailed Analysis</h3>
                <div className="analysis-content markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={analysisMarkdownComponents}>
                {analysis}
              </ReactMarkdown>
                </div>
              </div>

              {metrics && metrics.noveltyScore > 0 && (
                <div className="additional-metrics">
                  <div className="metric-card">
                    <div className="metric-icon">📊</div>
                    <div className="metric-content">
                      <div className="metric-label">Papers Last Year</div>
                      <div className="metric-value">{metrics.papersLastYear}</div>
                      <div className="metric-subtext">
                        {metrics.papersLastYear === 0 && 'No recent papers found'}
                        {metrics.papersLastYear === 1 && 'Low activity'}
                        {metrics.papersLastYear >= 2 && metrics.papersLastYear < 10 && 'Moderate activity'}
                        {metrics.papersLastYear >= 10 && 'High activity'}
                      </div>
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-icon">🌱</div>
                    <div className="metric-content">
                      <div className="metric-label">Research Maturity</div>
                      <div className="metric-value">{metrics.researchMaturity}</div>
                      <div
                        className="metric-badge"
                        style={{ backgroundColor: getMaturityColor(metrics.researchMaturity) }}
                      >
                        {metrics.researchMaturity}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {similarPapers.length > 0 && (
                <div className="similar-papers-section">
                  <h3>Similar & Related Research Papers</h3>
                  <p className="papers-intro">
                    Found {similarPapers.length} paper{similarPapers.length !== 1 ? 's' : ''} that may be related to your research:
                  </p>
                  <div className="papers-grid">
                    {similarPapers.map((paper) => (
                      <PaperCard key={paper.id} paper={paper} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="history-panel">
          <div className="history-panel-header">
            <div>
              <p className="history-label">Recent analyses</p>
              <h4>Comparison history</h4>
            </div>
            {history.length > 0 && (
              <button className="history-clear" onClick={clearHistory}>Clear</button>
            )}
          </div>
          {history.length === 0 && (
            <p className="history-empty">Run a comparison to start building history.</p>
          )}
          <div className="history-list">
            {history.map((entry) => (
              <button
                key={entry.id}
                className={`history-item ${activeHistoryId === entry.id ? 'active' : ''}`}
                onClick={() => applyHistoryEntry(entry)}
              >
                <div className="history-item-top">
                  <span className="history-date">{formatDate(entry.createdAt)}</span>
                  {entry.metrics && entry.metrics.noveltyScore > 0 && (
                    <span className="history-score">{entry.metrics.noveltyScore}/10</span>
                  )}
                </div>
                <p className="history-summary">{entry.summary || 'No summary provided'}</p>
                <p className="history-preview">{entry.inputPreview || 'No input captured'}</p>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function generateOutline(markdown: string): OutlineItem[] {
  if (!markdown.trim()) {
    return [];
  }

  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const slugCounts: Record<string, number> = {};
  const outline: OutlineItem[] = [];
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const label = match[2].replace(/[\*`_>]/g, '').trim();
    if (!label) continue;

    const baseSlug = slugify(label);
    const count = slugCounts[baseSlug] ?? 0;
    slugCounts[baseSlug] = count + 1;
    const slug = count === 0 ? baseSlug : `${baseSlug}-${count + 1}`;

    outline.push({ id: slug, label, level });
  }

  return outline;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-') || 'section';
}

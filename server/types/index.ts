export interface ArxivPaper {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  published: string;
  updated: string;
  categories: string[];
  pdfLink: string;
}

export interface ResearcherProfile {
  interests: string[];
  recentPapers?: ArxivPaper[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatRequest {
  message: string;
  researchTopic?: string;
  context?: ChatMessage[];
}

export interface MatchRequest {
  interests: string[];
  keywords?: string[];
}

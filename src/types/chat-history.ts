import type { ChatMessage, ArxivPaper } from '../types';

export interface SavedConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  papers: ArxivPaper[];
  researchers: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatHistoryStorage {
  conversations: SavedConversation[];
}

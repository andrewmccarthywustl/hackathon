import type { ArxivPaper } from '../types';

const STORAGE_KEY = 'synapse-saved-papers';

export interface SavedPaper extends ArxivPaper {
  savedAt: Date;
  chatId?: string; // Reference to the chat where it was saved
}

export const savedPapersStorage = {
  // Get all saved papers
  getAll(): SavedPaper[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];

      const papers: SavedPaper[] = JSON.parse(data);
      // Convert date strings back to Date objects
      return papers.map(paper => ({
        ...paper,
        savedAt: new Date(paper.savedAt)
      }));
    } catch (error) {
      console.error('Failed to load saved papers:', error);
      return [];
    }
  },

  // Save a paper
  save(paper: ArxivPaper, chatId?: string): void {
    try {
      const savedPapers = this.getAll();

      // Check if paper is already saved
      if (savedPapers.some(p => p.id === paper.id)) {
        console.log('Paper already saved');
        return;
      }

      const savedPaper: SavedPaper = {
        ...paper,
        savedAt: new Date(),
        chatId
      };

      savedPapers.unshift(savedPaper); // Add to beginning
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPapers));
    } catch (error) {
      console.error('Failed to save paper:', error);
    }
  },

  // Remove a saved paper
  remove(paperId: string): void {
    try {
      const savedPapers = this.getAll().filter(p => p.id !== paperId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPapers));
    } catch (error) {
      console.error('Failed to remove paper:', error);
    }
  },

  // Check if a paper is saved
  isSaved(paperId: string): boolean {
    return this.getAll().some(p => p.id === paperId);
  },

  // Clear all saved papers
  clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear saved papers:', error);
    }
  }
};

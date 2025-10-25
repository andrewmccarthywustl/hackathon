import type { SavedConversation, ChatHistoryStorage } from '../types/chat-history';

const STORAGE_KEY = 'synapse-chat-history';

export const chatStorage = {
  // Get all saved conversations
  getAll(): SavedConversation[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];

      const storage: ChatHistoryStorage = JSON.parse(data);
      // Convert date strings back to Date objects
      return storage.conversations.map(conv => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messages: conv.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
    } catch (error) {
      console.error('Failed to load chat history:', error);
      return [];
    }
  },

  // Save a conversation
  save(conversation: SavedConversation): void {
    try {
      const conversations = this.getAll();
      const existingIndex = conversations.findIndex(c => c.id === conversation.id);

      if (existingIndex >= 0) {
        conversations[existingIndex] = conversation;
      } else {
        conversations.push(conversation);
      }

      // Sort by updatedAt (most recent first)
      conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      const storage: ChatHistoryStorage = { conversations };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  },

  // Get a specific conversation by ID
  getById(id: string): SavedConversation | undefined {
    return this.getAll().find(c => c.id === id);
  },

  // Delete a conversation
  delete(id: string): void {
    try {
      const conversations = this.getAll().filter(c => c.id !== id);
      const storage: ChatHistoryStorage = { conversations };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  },

  // Generate a title from the first user message
  generateTitle(firstMessage: string): string {
    const maxLength = 50;
    if (firstMessage.length <= maxLength) return firstMessage;
    return firstMessage.substring(0, maxLength) + '...';
  },

  // Generate a unique ID
  generateId(): string {
    return `chat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
};

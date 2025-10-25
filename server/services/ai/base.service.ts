import type { ArxivPaper } from '../../types';

/**
 * Tool/Function call structure
 */
export interface ToolCall {
  name: string;
  args: Record<string, any>;
}

/**
 * AI Response structure
 */
export interface AIResponse {
  response: string;
  papers?: ArxivPaper[];
  researchers?: string[];
}

/**
 * Chat message structure
 */
export interface ChatContext {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Base AI Service Interface
 * All AI providers must implement this interface
 */
export abstract class BaseAIService {
  /**
   * Send a chat message and get a response
   * The service handles the ReAct loop internally
   */
  abstract chat(message: string, context: ChatContext[]): Promise<AIResponse>;

  /**
   * Get the provider name
   */
  abstract getProviderName(): string;

  /**
   * Get the model being used
   */
  abstract getModelName(): string;
}

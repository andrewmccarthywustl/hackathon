import { BaseAIService } from './base.service.js';
import { GeminiService } from '../gemini.service.js';
import { OpenAIService } from './openai.service.js';
import { ClaudeService } from './claude.service.js';
import { loadAIConfig, validateAIConfig } from '../../config/ai.config.js';

/**
 * AI Router - Factory pattern for creating AI service instances
 * Provides a singleton instance based on configuration
 */
export class AIRouter {
  private static instance: BaseAIService | null = null;

  /**
   * Get the configured AI service instance
   * Creates a singleton instance on first call based on environment configuration
   */
  static getService(): BaseAIService {
    if (!this.instance) {
      const config = loadAIConfig();
      validateAIConfig(config);

      console.log(`[AIRouter] Initializing ${config.provider} provider`);

      if (config.provider === 'gemini') {
        if (!config.gemini) {
          throw new Error('Gemini configuration is missing');
        }
        this.instance = new GeminiService(
          config.gemini.apiKey,
          config.gemini.model
        );
        console.log(`[AIRouter] Created GeminiService with model: ${config.gemini.model}`);
      } else if (config.provider === 'openai') {
        if (!config.openai) {
          throw new Error('OpenAI configuration is missing');
        }
        this.instance = new OpenAIService(
          config.openai.apiKey,
          config.openai.model
        );
        console.log(`[AIRouter] Created OpenAIService with model: ${config.openai.model}`);
      } else if (config.provider === 'claude') {
        if (!config.claude) {
          throw new Error('Claude configuration is missing');
        }
        this.instance = new ClaudeService(
          config.claude.apiKey,
          config.claude.model
        );
        console.log(`[AIRouter] Created ClaudeService with model: ${config.claude.model}`);
      } else {
        throw new Error(`Unsupported AI provider: ${config.provider}`);
      }
    }

    return this.instance;
  }

  /**
   * Reset the singleton instance (useful for testing or configuration changes)
   */
  static reset(): void {
    this.instance = null;
    console.log('[AIRouter] Instance reset');
  }

  /**
   * Get information about the current provider
   */
  static getProviderInfo(): { provider: string; model: string } {
    const service = this.getService();
    return {
      provider: service.getProviderName(),
      model: service.getModelName()
    };
  }
}

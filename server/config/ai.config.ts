/**
 * AI Provider Configuration
 *
 * Configure which AI provider to use and their settings
 */

export type AIProvider = 'gemini' | 'openai' | 'claude';

export interface AIConfig {
  provider: AIProvider;
  gemini?: {
    apiKey: string;
    model: string;
  };
  openai?: {
    apiKey: string;
    model: string;
  };
  claude?: {
    apiKey: string;
    model: string;
  };
}

/**
 * Load AI configuration from environment variables
 */
export function loadAIConfig(): AIConfig {
  const provider = (process.env.AI_PROVIDER || 'gemini') as AIProvider;

  const config: AIConfig = {
    provider,
  };

  if (provider === 'gemini' || !process.env.AI_PROVIDER) {
    config.gemini = {
      apiKey: process.env.GEMINI_API_KEY || '',
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    };
  }

  if (provider === 'openai') {
    config.openai = {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4o',
    };
  }

  if (provider === 'claude') {
    config.claude = {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-5',
    };
  }

  return config;
}

/**
 * Validate AI configuration
 */
export function validateAIConfig(config: AIConfig): void {
  if (config.provider === 'gemini') {
    if (!config.gemini?.apiKey) {
      throw new Error('GEMINI_API_KEY is required when using Gemini provider');
    }
  } else if (config.provider === 'openai') {
    if (!config.openai?.apiKey) {
      throw new Error('OPENAI_API_KEY is required when using OpenAI provider');
    }
  } else if (config.provider === 'claude') {
    if (!config.claude?.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required when using Claude provider');
    }
  } else {
    throw new Error(`Invalid AI provider: ${config.provider}`);
  }
}

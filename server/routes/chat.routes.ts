import { Router, Request, Response } from 'express';
import { AIRouter } from '../services/ai/ai-router';
import type { ChatRequest } from '../types';

export function createChatRouter(): Router {
  const router = Router();

  /**
   * POST /api/chat
   * Unified chat endpoint - AI automatically decides which tools to use
   * The AI provider (Gemini or OpenAI) is configured via environment variables
   */
  router.post('/chat', async (req: Request, res: Response) => {
    try {
      const { message, context }: ChatRequest = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Get the configured AI service (Gemini or OpenAI)
      const aiService = AIRouter.getService();

      // AI will automatically call the right functions based on the message
      const result = await aiService.chat(message, context || []);

      res.json({
        response: result.response,
        relatedPapers: result.papers,
        researchers: result.researchers
      });
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ error: 'Failed to process chat message' });
    }
  });

  /**
   * GET /api/chat/provider
   * Get information about the current AI provider
   */
  router.get('/chat/provider', (req: Request, res: Response) => {
    try {
      const providerInfo = AIRouter.getProviderInfo();
      res.json(providerInfo);
    } catch (error) {
      console.error('Provider info error:', error);
      res.status(500).json({ error: 'Failed to get provider information' });
    }
  });

  return router;
}

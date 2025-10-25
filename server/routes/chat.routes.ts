import { Router, Request, Response } from 'express';
import { GeminiService } from '../services/gemini.service';
import type { ChatRequest } from '../types';

export function createChatRouter(geminiService: GeminiService): Router {
  const router = Router();

  /**
   * POST /api/chat
   * Unified chat endpoint - AI automatically decides which tools to use
   */
  router.post('/chat', async (req: Request, res: Response) => {
    try {
      const { message, context }: ChatRequest = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Gemini will automatically call the right functions based on the message
      const result = await geminiService.chat(message, context);

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

  return router;
}

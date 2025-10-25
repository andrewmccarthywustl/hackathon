import { Router, Request, Response } from 'express';
import { loadAIConfig } from '../config/ai.config.js';

export function createChatKitRouter(): Router {
  const router = Router();

  /**
   * POST /api/create-session
   * Creates a ChatKit session with OpenAI
   */
  router.post('/create-session', async (req: Request, res: Response) => {
    try {
      const { workflow, chatkit_configuration } = req.body;

      if (!workflow?.id) {
        return res.status(400).json({
          error: 'Workflow ID is required',
          details: 'Please provide a valid workflow.id in the request body'
        });
      }

      // Get OpenAI API key from config
      const config = loadAIConfig();
      const apiKey = config.openai?.apiKey;

      if (!apiKey) {
        return res.status(500).json({
          error: 'OpenAI API key not configured',
          details: 'Please set OPENAI_API_KEY in your .env file'
        });
      }

      // Create session with OpenAI ChatKit API
      const response = await fetch('https://api.openai.com/v1/chatkit/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta': 'chatkit-v1'
        },
        body: JSON.stringify({
          workflow: {
            id: workflow.id
          },
          chatkit_configuration: chatkit_configuration || {
            file_upload: {
              enabled: true
            }
          }
        })
      });

      const data = await response.json() as Record<string, unknown>;

      if (!response.ok) {
        console.error('OpenAI ChatKit session creation failed:', data);
        return res.status(response.status).json({
          error: 'Failed to create ChatKit session',
          details: (data as { error?: unknown }).error || data,
          status: response.status
        });
      }

      // Return the session with client_secret
      res.json(data);
    } catch (error) {
      console.error('ChatKit session creation error:', error);
      res.status(500).json({
        error: 'Failed to create ChatKit session',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}

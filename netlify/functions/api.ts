import express, { Express, Request, Response } from 'express';
import serverless from 'serverless-http';
import cors from 'cors';

// Import routes with proper path resolution
import { createChatRouter } from '../../server/routes/chat.routes';
import { createProfileRouter } from '../../server/routes/profile.routes';
import { createChatKitRouter } from '../../server/routes/chatkit.routes';
import { createResearchCompareRouter } from '../../server/routes/research-compare.routes';

// Create Express app
const app: Express = express();

// Middleware
app.use(cors({
  origin: true, // Allow all origins in serverless
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add error handling for the entire app
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Express error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Routes (note: paths include /api since that's how they're defined in the routers)
app.use('/api', createChatRouter());
app.use('/api', createProfileRouter());
app.use('/api', createChatKitRouter());
app.use('/api', createResearchCompareRouter());

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasAIProvider: !!process.env.AI_PROVIDER
    }
  });
});

// Catch-all for debugging
app.use('*', (req: Request, res: Response) => {
  console.log('Unhandled route:', req.method, req.originalUrl);
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Export the serverless handler
export const handler = serverless(app);

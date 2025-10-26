import express, { Express, Request, Response } from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import { createResearchCompareRouter } from '../../server/routes/research-compare.routes';

// Create Express app specifically for research comparison
const app: Express = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Error handling
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Express error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Mount the research compare router
app.use('/api', createResearchCompareRouter());

// Export the serverless handler
export const handler = serverless(app);

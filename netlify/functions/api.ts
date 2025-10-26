import express, { Express } from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import dotenv from 'dotenv';
import { createChatRouter } from '../../server/routes/chat.routes.js';
import { createProfileRouter } from '../../server/routes/profile.routes.js';
import { createChatKitRouter } from '../../server/routes/chatkit.routes.js';
import { createResearchCompareRouter } from '../../server/routes/research-compare.routes.js';
import { loadAIConfig, validateAIConfig } from '../../server/config/ai.config.js';

// Load environment variables (Netlify will inject these automatically)
dotenv.config();

// Create Express app
const app: Express = express();

// Middleware
app.use(cors({
  origin: true, // Allow all origins in serverless (you can restrict this)
  credentials: true
}));
app.use(express.json());

// Validate AI configuration
try {
  const aiConfig = loadAIConfig();
  validateAIConfig(aiConfig);
  console.log(`✅ AI Provider: ${aiConfig.provider}`);
} catch (error) {
  console.error('❌ AI Configuration Error:', error);
  // Don't exit in serverless - just log the error
}

// Routes (note: no '/api' prefix here since Netlify redirects handle that)
app.use('/api', createChatRouter());
app.use('/api', createProfileRouter());
app.use('/api', createChatKitRouter());
app.use('/api', createResearchCompareRouter());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Export the serverless handler
export const handler = serverless(app);

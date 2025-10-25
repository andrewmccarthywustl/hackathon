import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createChatRouter } from './routes/chat.routes.js';
import { createProfileRouter } from './routes/profile.routes.js';
import { createChatKitRouter } from './routes/chatkit.routes.js';
import { loadAIConfig, validateAIConfig } from './config/ai.config.js';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Validate AI configuration on startup
try {
  const aiConfig = loadAIConfig();
  validateAIConfig(aiConfig);
  console.log(`✅ AI Provider: ${aiConfig.provider}`);
  if (aiConfig.provider === 'gemini') {
    console.log(`   Model: ${aiConfig.gemini?.model}`);
  } else if (aiConfig.provider === 'openai') {
    console.log(`   Model: ${aiConfig.openai?.model}`);
  } else if (aiConfig.provider === 'claude') {
    console.log(`   Model: ${aiConfig.claude?.model}`);
  }
} catch (error) {
  console.error('❌ AI Configuration Error:', error);
  process.exit(1);
}

// Routes
app.use('/api', createChatRouter());
app.use('/api', createProfileRouter());
app.use('/api', createChatKitRouter());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Researcher Chat API running on http://localhost:${PORT}`);
  console.log(`📚 API endpoints available at http://localhost:${PORT}/api\n`);
});

import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createChatRouter } from './routes/chat.routes.js';
import { createProfileRouter } from './routes/profile.routes.js';
import { createChatKitRouter } from './routes/chatkit.routes.js';
import { createResearchCompareRouter } from './routes/research-compare.routes.js';
import { loadAIConfig, validateAIConfig } from './config/ai.config.js';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware - Allow all origins for now (can restrict later)
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Validate AI configuration on startup (warn but don't exit on error)
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
  console.error('⚠️  AI Configuration Error (server will start anyway):', error);
  console.error('⚠️  AI features may not work until environment variables are configured');
}

// Routes
app.use('/api', createChatRouter());
app.use('/api', createProfileRouter());
app.use('/api', createChatKitRouter());
app.use('/api', createResearchCompareRouter());

// Health check
app.get('/health', (req, res) => {
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

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Synapse AI API',
    version: '1.0.0',
    status: 'running'
  });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 Researcher Chat API running on http://0.0.0.0:${PORT}`);
  console.log(`📚 API endpoints available at http://0.0.0.0:${PORT}/api\n`);
});

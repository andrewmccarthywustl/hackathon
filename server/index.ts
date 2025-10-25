import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GeminiService } from './services/gemini.service.js';
import { createChatRouter } from './routes/chat.routes.js';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  console.error('ERROR: GEMINI_API_KEY is not set in environment variables');
  process.exit(1);
}

const geminiService = new GeminiService(geminiApiKey);

// Routes
app.use('/api', createChatRouter(geminiService));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Researcher Chat API running on http://localhost:${PORT}`);
  console.log(`📚 API endpoints available at http://localhost:${PORT}/api\n`);
});

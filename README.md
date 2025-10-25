# Researcher Chat

A React + TypeScript application that helps researchers connect with others in their field, explore research topics, and get answers to questions using the arXiv API and Google Gemini AI.

## Features

- **AI-Powered Chat**: Ask questions about research topics and get intelligent responses backed by arXiv papers
- **Find Researchers**: Discover researchers working on similar topics based on recent publications
- **Analyze Interests**: Get AI analysis of your research interests with suggestions for collaboration and exploration
- **arXiv Integration**: Automatically fetch and reference relevant research papers
- **Modern React UI**: Built with React 19, TypeScript, and Vite for fast development

## Tech Stack

**Frontend:**
- React 19 + TypeScript
- Vite for fast builds and HMR
- React Compiler enabled

**Backend:**
- Node.js + Express + TypeScript
- Google Gemini API for AI responses
- arXiv API for research papers

## Quick Start

### 1. Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 2. Set Up Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your API key
# GEMINI_API_KEY=your_actual_api_key_here
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Application

You need to run both the frontend and backend:

**Option A: Run both together (recommended)**
```bash
npm run dev:all
```

**Option B: Run separately in different terminals**
```bash
# Terminal 1 - Backend API
npm run dev:server

# Terminal 2 - Frontend
npm run dev
```

The frontend will be available at [http://localhost:5173](http://localhost:5173)
The backend API will be at [http://localhost:3001](http://localhost:3001)

## Project Structure

```
hackathon/
├── src/                       # React frontend
│   ├── components/
│   │   ├── Chat.tsx          # Chat interface component
│   │   ├── FindResearchers.tsx
│   │   ├── AnalyzeInterests.tsx
│   │   └── PaperCard.tsx     # Paper display component
│   ├── App.tsx               # Main app component
│   ├── types.ts              # TypeScript types
│   └── main.tsx
├── server/                    # Express backend
│   ├── services/
│   │   ├── arxiv.service.ts  # arXiv API integration
│   │   └── gemini.service.ts # Gemini AI integration
│   ├── routes/
│   │   └── chat.routes.ts    # API route handlers
│   ├── types/
│   │   └── index.ts
│   └── index.ts              # Server entry point
├── package.json
├── vite.config.ts            # Vite config with API proxy
└── README.md
```

## How to Use

### Chat Tab
Ask questions about research topics:
- "What are the latest developments in quantum machine learning?"
- "How do transformers work in NLP?"
- "Explain reinforcement learning approaches"

The AI will respond with context from recent arXiv papers.

### Find Researchers Tab
1. Enter your research interests (comma-separated): `machine learning, computer vision`
2. Optionally add keywords: `neural networks, deep learning`
3. Get AI analysis of potential collaborators and their recent work

### Analyze Interests Tab
1. Enter topics: `natural language processing, transformers`
2. Get insights about the field, collaboration opportunities, and suggested questions

## API Endpoints

### POST /api/chat
Chat with the AI assistant about research topics.

### POST /api/find-researchers
Find researchers working on similar topics.

### POST /api/analyze-interests
Analyze research interests and get insights.

### GET /api/search-papers
Search arXiv papers directly.

## Scripts

- `npm run dev` - Start Vite dev server (frontend only)
- `npm run dev:server` - Start Express API server
- `npm run dev:all` - Run both frontend and backend concurrently
- `npm run build` - Build frontend for production
- `npm run build:server` - Build backend for production
- `npm run preview` - Preview production build

## Troubleshooting

### "GEMINI_API_KEY is not set"
Make sure you have created a `.env` file with your Gemini API key.

### Connection errors
Ensure both the frontend (port 5173) and backend (port 3001) are running.

### arXiv API rate limiting
The arXiv API may rate-limit requests. If you encounter issues, reduce the number of concurrent requests or add delays.

## Built With

- React 19 with React Compiler
- TypeScript
- Vite
- Express
- Google Gemini API
- arXiv API

## License

MIT

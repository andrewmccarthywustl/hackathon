# Research Chronicle

A React + TypeScript application that helps researchers connect with others in their field, explore research topics, and get answers to questions using multiple academic APIs and AI providers.

## Features

- **AI-Powered Chat**: Ask questions about research topics and get intelligent responses backed by research papers
- **Multiple AI Providers**: Choose between Google Gemini or OpenAI GPT-4
- **Find Researchers**: Discover researchers at specific institutions or working on specific topics
- **Researcher Contact Information**: Get comprehensive contact details including ORCID, Google Scholar, homepages, and more
- **Multi-Source Integration**:
  - arXiv API for paper searches
  - Semantic Scholar for author and citation data
  - OpenAlex for institutional searches and researcher profiles
- **ReAct Agent Framework**: Autonomous AI that decides which tools to use based on your queries
- **Modern React UI**: Built with React 19, TypeScript, and Vite for fast development
- **Markdown Support**: Rich text formatting in AI responses

## Tech Stack

**Frontend:**
- React 19 + TypeScript
- Vite for fast builds and HMR
- React Compiler enabled
- React Markdown for formatted responses

**Backend:**
- Node.js + Express + TypeScript
- Google Gemini API OR OpenAI GPT-4 (configurable)
- arXiv API for research papers
- Semantic Scholar API for academic data
- OpenAlex API for institutional searches
- ReAct (Reasoning + Acting) agent framework
- Supabase Postgres for persistent cloud storage

## Quick Start

### 1. Choose Your AI Provider

**Option A: Google Gemini (Default)**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

**Option B: OpenAI GPT-4**
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in to your account
3. Create a new API key
4. Copy your API key

**Option C: Anthropic Claude**
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Sign in to your account
3. Go to API Keys section
4. Create a new API key
5. Copy your API key

### 2. Set Up Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and configure your AI provider
```

**For Gemini (default):**
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_actual_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

**For OpenAI:**
```env
AI_PROVIDER=openai
OPENAI_API_KEY=your_actual_api_key_here
OPENAI_MODEL=gpt-4o
```

**For Claude:**
```env
AI_PROVIDER=claude
ANTHROPIC_API_KEY=your_actual_api_key_here
CLAUDE_MODEL=claude-sonnet-4-5
```

### 2.1 Configure Supabase Storage

1. [Create a Supabase project](https://supabase.com/dashboard/projects) if you don't already have one.
2. In the SQL Editor, run the following scripts to create the required tables:

```sql
-- Stores researcher onboarding + profile submissions
create table if not exists public.researcher_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  institution text not null,
  department text,
  research_interests text[] not null default '{}',
  bio text,
  homepage text,
  orcid text,
  google_scholar text,
  avatar_icon text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists researcher_profiles_email_idx on public.researcher_profiles (email);

-- Persists research compare summaries + metrics
create table if not exists public.research_compare_snapshots (
  id uuid primary key default gen_random_uuid(),
  generated_at timestamptz not null default now(),
  summary text,
  metrics jsonb not null,
  analysis text,
  similar_papers jsonb,
  input_preview text
);
```

3. In **Project Settings → API**, copy your `Project URL` and `service_role` key.
4. Update `.env` with the new values:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# Optional overrides (defaults shown)
SUPABASE_PROFILES_TABLE=researcher_profiles
SUPABASE_COMPARE_TABLE=research_compare_snapshots

# Frontend → backend base URL (set to your deployed API origin in production)
VITE_API_BASE_URL=http://localhost:3001
```

> 💡 The backend uses the `service_role` key, so keep it on the server side only. Enable Row Level Security (RLS) and rely on the service role for trusted access.

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

### Chat Interface
The AI uses a ReAct (Reasoning + Acting) framework and autonomously decides which tools to use. Just ask naturally!

**Example queries:**
- "Show me recent papers on quantum computing"
- "Find biomedical researchers at WashU"
- "Who are the leading researchers in machine learning at MIT?"
- "What are the trends in neuroscience?"

The AI will automatically:
- Search for papers when you ask about research topics
- Find researchers when you mention institutions or fields
- Provide contact information including ORCID, Google Scholar, homepages, etc.
- Format responses with markdown for better readability

### Profile Tab
Create and manage your research profile with your interests and expertise.

## API Endpoints

### POST /api/chat
Unified chat endpoint - the AI decides which tools to use based on your message.

**Request:**
```json
{
  "message": "Find machine learning researchers at Stanford",
  "context": []
}
```

**Response:**
```json
{
  "response": "Here are machine learning researchers at Stanford...",
  "relatedPapers": [...],
  "researchers": [...]
}
```

### GET /api/chat/provider
Get information about the current AI provider.

**Response:**
```json
{
  "provider": "OpenAI",
  "model": "gpt-4o"
}
```

### POST /api/profile
Persists a researcher profile to Supabase and returns the saved record.

**Requires:** `name`, `email`, `institution`. Optional fields include `department`, `researchInterests`, `bio`, `homepage`, `orcid`, `googleScholar`, `avatarIcon`.

### GET /api/profiles
Lists all stored researcher profiles ordered by `createdAt`. Useful for admin tooling or analytics.

### POST /api/compare-research
Accepts raw research text or an uploaded file (`text/plain`, `pdf`, or `docx`), generates novelty + overlap metrics, and stores the summary + metrics in Supabase for auditing.

## Scripts

- `npm run dev` - Start Vite dev server (frontend only)
- `npm run dev:server` - Start Express API server
- `npm run dev:all` - Run both frontend and backend concurrently
- `npm run build` - Build frontend for production
- `npm run build:server` - Build backend for production
- `npm run preview` - Preview production build

## AI Provider Configuration

### Switching Between Providers

To switch between providers, simply change the `AI_PROVIDER` in your `.env` file:

```env
# Use Gemini
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-2.5-flash

# OR use OpenAI
AI_PROVIDER=openai
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-4o

# OR use Claude
AI_PROVIDER=claude
ANTHROPIC_API_KEY=your_key
CLAUDE_MODEL=claude-sonnet-4-5
```

Restart the server after changing providers.

### Available Models

**Gemini:**
- `gemini-2.5-flash` (default - fast and cost-effective)
- `gemini-2.5-pro` (thinking model)

**OpenAI:**
- `gpt-4o` (default - most capable)
- `gpt-4o-mini` (faster, cheaper)
- `gpt-4-turbo`

**Claude:**
- `claude-sonnet-4-5` (default - most capable, latest model)
- `claude-sonnet-4` (previous generation)
- `claude-opus-4` (most capable, higher cost)

## Troubleshooting

### "AI Configuration Error"
Make sure you have:
1. Created a `.env` file based on `.env.example`
2. Set `AI_PROVIDER` to either `gemini` or `openai`
3. Provided the corresponding API key and model

### "API key is missing"
Ensure your `.env` file has the correct API key for your chosen provider.

### Connection errors
Ensure both the frontend (port 5173) and backend (port 3001) are running.

### API rate limiting
The external APIs (arXiv, OpenAlex, Semantic Scholar) may rate-limit requests. The application includes polite delays and caching to minimize this.

## Built With

**Frontend:**
- React 19 with React Compiler
- TypeScript
- Vite
- React Markdown with GitHub Flavored Markdown

**Backend:**
- Node.js + Express
- TypeScript
- Google Gemini API (configurable)
- OpenAI GPT-4 API (configurable)
- arXiv API
- Semantic Scholar API
- OpenAlex API

**Architecture:**
- ReAct (Reasoning + Acting) agent framework
- Factory pattern for AI provider abstraction
- Abstract base classes for extensibility

## License

MIT

# Environment Variables Guide

Complete guide for setting up environment variables for Render (backend) and Vercel (frontend).

## 🔧 Backend (Render) Environment Variables

### Required Variables

Add these in **Render Dashboard → Environment** section:

#### 1. Node Configuration
```bash
NODE_VERSION=20.11.0
NODE_ENV=production
```

#### 2. Supabase Configuration
Get these from your Supabase project dashboard at https://app.supabase.com

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**How to find:**
- Go to Supabase Dashboard → Project Settings → API
- `SUPABASE_URL` = Project URL
- `SUPABASE_SERVICE_ROLE_KEY` = service_role key (under "Project API keys")

#### 3. AI Provider Configuration

Choose ONE of the following providers:

**Option A: Claude (Recommended)**
```bash
AI_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx
CLAUDE_MODEL=claude-sonnet-4-5
```

Get your API key: https://console.anthropic.com/settings/keys

**Option B: OpenAI**
```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o
```

Get your API key: https://platform.openai.com/api-keys

**Option C: Google Gemini**
```bash
AI_PROVIDER=gemini
GOOGLE_AI_API_KEY=xxxxxxxxxxxxxxxxxxxxx
GEMINI_MODEL=gemini-2.5-flash
```

Get your API key: https://aistudio.google.com/app/apikey

### Optional Variables

```bash
# Override default Supabase table names (if you use custom names)
SUPABASE_PROFILES_TABLE=researcher_profiles
SUPABASE_COMPARE_TABLE=research_compare_snapshots

# Port (Render sets this automatically, don't override)
# PORT=3001
```

---

## 🎨 Frontend (Vercel) Environment Variables

Add these in **Vercel Dashboard → Settings → Environment Variables**:

### Required Variables

```bash
# Point to your Render backend
VITE_API_BASE_URL=https://your-app.onrender.com
```

Replace `your-app` with your actual Render service name.

### Optional Variables

```bash
# ChatKit workflow ID (if using OpenAI ChatKit)
VITE_CHATKIT_WORKFLOW_ID=your_workflow_id_here
```

Get from: https://platform.openai.com/chatkit

---

## 🏠 Local Development (.env.local)

Create a `.env.local` file in your project root for local development:

```bash
# AI Provider (choose one: claude, openai, or gemini)
AI_PROVIDER=claude

# Claude Configuration
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx
CLAUDE_MODEL=claude-sonnet-4-5

# OR OpenAI Configuration
# OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
# OPENAI_MODEL=gpt-4o

# OR Gemini Configuration
# GOOGLE_AI_API_KEY=xxxxxxxxxxxxxxxxxxxxx
# GEMINI_MODEL=gemini-2.5-flash

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Server Configuration (local)
PORT=3001

# Frontend API (point to local backend)
VITE_API_BASE_URL=http://localhost:3001

# Optional: ChatKit
VITE_CHATKIT_WORKFLOW_ID=your_workflow_id_here
```

---

## 📋 Quick Setup Checklist

### Render (Backend)

- [ ] `NODE_VERSION` = `20.11.0`
- [ ] `NODE_ENV` = `production`
- [ ] `SUPABASE_URL` = Your Supabase project URL
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = Your Supabase service role key
- [ ] `AI_PROVIDER` = `claude` or `openai` or `gemini`
- [ ] AI Provider API Key (one of):
  - [ ] `ANTHROPIC_API_KEY` (if using Claude)
  - [ ] `OPENAI_API_KEY` (if using OpenAI)
  - [ ] `GOOGLE_AI_API_KEY` (if using Gemini)

### Vercel (Frontend)

- [ ] `VITE_API_BASE_URL` = Your Render app URL (e.g., `https://synapse-api.onrender.com`)
- [ ] `VITE_CHATKIT_WORKFLOW_ID` (optional, only if using ChatKit)

---

## 🔍 How to Find Your Values

### Supabase Keys
1. Go to https://app.supabase.com
2. Select your project
3. Click "Project Settings" (gear icon)
4. Click "API" in the sidebar
5. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### Anthropic (Claude) API Key
1. Go to https://console.anthropic.com
2. Click "API Keys" in the sidebar
3. Click "Create Key"
4. Copy the key → `ANTHROPIC_API_KEY`

### OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key → `OPENAI_API_KEY`

### Google AI (Gemini) API Key
1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key → `GOOGLE_AI_API_KEY`

### Render App URL
After deploying to Render:
1. Go to your service dashboard
2. Look for the URL at the top (e.g., `https://synapse-api.onrender.com`)
3. Copy this → `VITE_API_BASE_URL`

---

## ⚠️ Security Notes

### DO NOT:
- ❌ Commit `.env` or `.env.local` files to Git
- ❌ Share API keys publicly
- ❌ Use production keys in development (use separate keys if possible)

### DO:
- ✅ Use environment variables in deployment platforms
- ✅ Keep `.env.example` updated (without real values)
- ✅ Rotate keys if they're accidentally exposed
- ✅ Use different API keys for dev/staging/prod if possible

---

## 🧪 Testing Your Setup

### Test Backend (Render)

After setting environment variables on Render:

```bash
# Health check (should return status: ok)
curl https://your-app.onrender.com/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-10-26T...",
  "env": {
    "hasSupabaseUrl": true,
    "hasSupabaseKey": true,
    "hasAIProvider": true
  }
}
```

All three `env` values should be `true`. If any are `false`, that variable is missing.

### Test Frontend (Vercel)

After deploying to Vercel:
1. Open browser console (F12)
2. Check Network tab
3. Make an API request (e.g., sign up)
4. Verify requests go to your Render URL

---

## 🆘 Troubleshooting

### Backend shows "hasAIProvider: false"
- Missing or incorrect `AI_PROVIDER` variable
- Should be exactly: `claude`, `openai`, or `gemini`

### Backend shows "hasSupabaseUrl: false"
- Missing `SUPABASE_URL` variable
- Check format: `https://your-project.supabase.co`

### Frontend shows CORS errors
- Verify `VITE_API_BASE_URL` is set correctly
- Should NOT end with a slash: ❌ `.../` ✅ `...com`

### AI features not working
- Missing AI provider API key
- Check you set the correct key for your `AI_PROVIDER`:
  - `claude` needs `ANTHROPIC_API_KEY`
  - `openai` needs `OPENAI_API_KEY`
  - `gemini` needs `GOOGLE_AI_API_KEY`

---

## 📝 Copy-Paste Templates

### Render Environment Variables (Manual Entry)

```
NODE_VERSION = 20.11.0
NODE_ENV = production
SUPABASE_URL = https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY = YOUR_SERVICE_ROLE_KEY
AI_PROVIDER = claude
ANTHROPIC_API_KEY = YOUR_ANTHROPIC_KEY
CLAUDE_MODEL = claude-sonnet-4-5
```

### Vercel Environment Variables (Manual Entry)

```
VITE_API_BASE_URL = https://your-app.onrender.com
```

---

Need help? Check the main deployment guides:
- Backend: See `RENDER_DEPLOYMENT.md`
- Frontend: See `VERCEL_DEPLOYMENT.md`

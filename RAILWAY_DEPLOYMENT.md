# Railway Deployment Guide

This guide will help you deploy the Synapse AI backend to Railway.

## Why Railway?

- ✅ **No timeout limits** - Long-running AI requests work perfectly
- ✅ **Streaming support** - Server-Sent Events (SSE) work out of the box
- ✅ **Free tier** - $5/month free credit (plenty for development)
- ✅ **Simple deployment** - Connect GitHub and deploy in minutes

## Deployment Steps

### 1. Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub

### 2. Create New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `hackathon` repository
4. Railway will detect the configuration automatically

### 3. Configure Environment Variables

Add these environment variables in Railway dashboard:

**Required:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `AI_PROVIDER` - Your AI provider (e.g., "claude", "openai", "gemini")

**AI Provider Keys (choose one):**
- `ANTHROPIC_API_KEY` - If using Claude
- `OPENAI_API_KEY` - If using OpenAI
- `GOOGLE_AI_API_KEY` - If using Gemini

**Optional:**
- `PORT` - Railway sets this automatically, don't override
- `NODE_ENV` - Set to "production"

### 3.1 Pin Node.js 20

Supabase's SDK now requires Node.js 20+. Railway builds use Nixpacks, so this repo ships `nixpacks.toml` with `NIXPACKS_NODE_VERSION = "20"`. If you override variables in the Railway UI, make sure you keep that value (or add the variable manually) so deployments continue using Node 20.

### 4. Deploy

1. Railway will automatically build and deploy
2. Wait for deployment to complete (1-2 minutes)
3. Copy your Railway app URL (e.g., `https://your-app.railway.app`)

### 5. Update Frontend

Update your frontend to point to the Railway backend:

1. In Netlify (or wherever your frontend is hosted), add environment variable:
   - `VITE_API_URL=https://your-app.railway.app`

2. Or update `src/utils/api.ts` to use the Railway URL

### 6. Test

1. Visit `https://your-app.railway.app/health` - should return status OK
2. Test the research compare feature - should work without timeouts!

## Build Configuration

Railway uses these settings (already configured):

- **Build Command:** `npm run build` (runs `npm run build:server` and Vite build, so `server/dist` is ready before the container boots)
- **Start Command:** `npm run start:server`
- **Node Version:** Detected from package.json

## Monitoring

- View logs in Railway dashboard
- Monitor usage and credits
- Set up alerts for errors

## Cost Estimate

Free tier includes:
- $5/month credit
- Typical usage: ~$0.01-0.05 per hour
- Should be plenty for development/testing

## Troubleshooting

**Build fails:**
- Check that all dependencies are in `package.json`
- Verify TypeScript compiles locally: `npm run build:server`

**Environment variables not working:**
- Make sure they're set in Railway dashboard, not in `.env` file
- Restart the service after adding variables

**Still getting timeouts:**
- Check Railway logs for errors
- Verify streaming endpoint is being used (`/api/compare-research-stream`)

## Support

Railway has excellent documentation and Discord community:
- [Docs](https://docs.railway.app)
- [Discord](https://discord.gg/railway)

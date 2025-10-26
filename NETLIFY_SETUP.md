# Netlify Deployment Setup Guide

This guide will help you deploy your application to Netlify with proper environment variable configuration.

## Architecture

- **Frontend**: Vite React app (static files)
- **Backend**: Express server running as Netlify Functions (serverless)
- **Database**: Supabase

## Step 1: Install Netlify CLI (Optional, for local testing)

```bash
npm install -g netlify-cli
```

## Step 2: Configure Environment Variables in Netlify

Go to your Netlify site dashboard → **Site settings** → **Environment variables**

### Required Environment Variables

#### AI Provider Configuration (Choose ONE)

**Option A: Claude/Anthropic**
```
AI_PROVIDER=claude
ANTHROPIC_API_KEY=your_anthropic_api_key_here
CLAUDE_MODEL=claude-sonnet-4-5
```

**Option B: Google Gemini**
```
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

**Option C: OpenAI**
```
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o
```

#### Supabase Configuration (REQUIRED)
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Important**: Use the **Service Role Key** from Supabase, NOT the anon key, since this is for server-side operations.

#### Frontend Variables (Vite - REQUIRED)

These variables are accessible in your frontend code:

```
VITE_API_BASE_URL=https://your-railway-app.up.railway.app
VITE_CHATKIT_WORKFLOW_ID=your_workflow_id_here
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

**Note**: Set `VITE_API_BASE_URL` to your publicly accessible Railway backend so the frontend bypasses Netlify Function limits. Only set it to `relative` if you explicitly want Netlify to proxy `/api/*` on the same origin.

#### Optional Configuration

```
PORT=3001
SUPABASE_PROFILES_TABLE=researcher_profiles
SUPABASE_COMPARE_TABLE=research_compare_snapshots
```

## Step 3: Deploy to Netlify

### Option A: Deploy via Netlify Dashboard (Recommended)

1. Go to [https://app.netlify.com/](https://app.netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Connect your Git repository (GitHub, GitLab, or Bitbucket)
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`
5. Click "Deploy site"

### Option B: Deploy via Netlify CLI

```bash
# Login to Netlify
netlify login

# Initialize your site
netlify init

# Deploy
netlify deploy --prod
```

## Step 4: Test Your Deployment

After deployment, test these endpoints:

1. **Frontend**: `https://your-site.netlify.app`
2. **API Health Check**: `https://your-site.netlify.app/api/health`
3. **Chat API**: `https://your-site.netlify.app/api/chat`

## Step 5: Update Local Development

For local development, your `.env` file should have:

```env
# AI Provider
AI_PROVIDER=claude
ANTHROPIC_API_KEY=your_key_here
CLAUDE_MODEL=claude-sonnet-4-5

# Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Frontend (points to local server in dev)
VITE_API_BASE_URL=http://localhost:3001
VITE_CHATKIT_WORKFLOW_ID=your_workflow_id_here
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

Then run:

```bash
# Terminal 1 - Run frontend
npm run dev

# Terminal 2 - Run backend locally (for local testing)
npm run dev:server

# Or run both together
npm run dev:all
```

## Step 6: Test Netlify Functions Locally

```bash
# Install Netlify CLI if you haven't
npm install -g netlify-cli

# Run Netlify dev server (simulates production environment)
netlify dev
```

This will run your site locally with Netlify Functions enabled.

## Environment Variables Summary

### Backend Variables (Server-side only - SAFE)
These are only accessible in Netlify Functions and never exposed to the browser:

- `AI_PROVIDER`
- `ANTHROPIC_API_KEY`
- `GEMINI_API_KEY`
- `OPENAI_API_KEY`
- `CLAUDE_MODEL`
- `GEMINI_MODEL`
- `OPENAI_MODEL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PROFILES_TABLE`
- `SUPABASE_COMPARE_TABLE`
- `GOOGLE_CLIENT_ID` (for server-side OAuth validation)

### Frontend Variables (Browser-accessible)
These are embedded in your built frontend and accessible in the browser:

- `VITE_API_BASE_URL` (set to your Railway URL, or `relative` to force Netlify Functions)
- `VITE_CHATKIT_WORKFLOW_ID`
- `VITE_GOOGLE_CLIENT_ID`

**Security Note**: Never put API keys or secrets in `VITE_*` variables - they will be exposed to anyone visiting your site!

## Troubleshooting

### 504 Gateway Timeout Error
This means the Netlify Function is taking too long to respond (max 26 seconds on free tier).

**For Research Compare endpoint:**
- AI analysis can take 20-30 seconds for complex research queries
- Netlify Functions time out after ~26 seconds on the free tier

**Best fix:** Point `VITE_API_BASE_URL` at your Railway deployment so the frontend bypasses Netlify Functions entirely. If you must stay on Netlify Functions, keep requests small or upgrade to Netlify Pro for longer timeouts.

### 502 Bad Gateway Error
This typically means the Netlify Function is crashing. To debug:

1. **Check Netlify Function Logs**:
   - Go to your Netlify dashboard
   - Click on "Functions" tab
   - Click on the "api" function
   - View the logs to see the actual error

2. **Common causes**:
   - Missing environment variables (check all required vars are set)
   - Supabase connection issues
   - Import/module resolution errors
   - Timeout (functions have a 10-second default timeout)

3. **Verify environment variables are set**:
   - Visit `https://your-site.netlify.app/api/health`
   - Check that all `has*` fields return `true`

### Functions not working
- Check Netlify Functions logs in your dashboard
- Ensure `netlify.toml` is in the root directory
- Verify environment variables are set correctly
- Make sure you committed all files in `netlify/functions/`

### CORS errors
- The CORS middleware is configured to allow all origins in production
- You can restrict this in `netlify/functions/api.ts` if needed

### Supabase connection issues
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
- Check your Supabase project is active and accessible
- Ensure the service role key has proper permissions

### Build failures
- Check the build logs in Netlify dashboard
- Ensure all dependencies are in `package.json`
- Try building locally first: `npm run build`
- Check that TypeScript compilation succeeds

### Import/Module errors
- Netlify uses esbuild which handles TypeScript natively
- If you see module resolution errors, check the paths in `netlify/functions/api.ts`
- Ensure `external_node_modules` in `netlify.toml` includes all necessary packages

## Additional Resources

- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)
- [Supabase Documentation](https://supabase.com/docs)

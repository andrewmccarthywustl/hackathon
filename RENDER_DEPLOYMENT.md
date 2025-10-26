# Render Backend Deployment Guide

Deploy your Synapse AI backend to Render - a reliable alternative to Railway with better stability.

## Why Render?

- ✅ **Free tier**: 750 hours/month (enough for 1 app running 24/7)
- ✅ **No timeout limits** on paid plans (15s on free tier)
- ✅ **Auto-deploy** from GitHub
- ✅ **Simple configuration** via `render.yaml`
- ✅ **Built-in SSL** and custom domains
- ✅ **Better stability** than Railway for many users

## Quick Start (Recommended)

### Option 1: Deploy via Dashboard (Easiest)

1. **Go to [render.com](https://render.com)** and sign up with GitHub

2. **Click "New +" → "Web Service"**

3. **Connect your repository**
   - Select your `hackathon` repository
   - Click "Connect"

4. **Configure the service:**
   - **Name**: `synapse-api` (or your choice)
   - **Region**: Oregon (or closest to you)
   - **Branch**: `main`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build:server`
   - **Start Command**: `node server/dist/index.js`
   - **Instance Type**: Free

5. **Add Environment Variables** (click "Advanced" → "Add Environment Variable"):
   ```
   NODE_VERSION=20.11.0
   NODE_ENV=production
   SUPABASE_URL=<your-supabase-url>
   SUPABASE_SERVICE_ROLE_KEY=<your-supabase-key>
   AI_PROVIDER=claude (or openai/gemini)
   ANTHROPIC_API_KEY=<your-key> (if using Claude)
   ```

6. **Click "Create Web Service"**

7. **Wait for deployment** (3-5 minutes)
   - You'll get a URL like: `https://synapse-api.onrender.com`

### Option 2: Deploy via render.yaml (Infrastructure as Code)

This repo includes a `render.yaml` file that automates the deployment.

1. **Go to [render.com](https://render.com)** and sign up

2. **Click "New +" → "Blueprint"**

3. **Connect your repository** and select the `hackathon` repo

4. **Render will detect `render.yaml`** and show the service config

5. **Add your environment variables** when prompted:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `AI_PROVIDER`
   - Your AI provider API key

6. **Click "Apply"** and wait for deployment

## Important Notes

### Free Tier Limitations

⚠️ **Free tier services spin down after 15 minutes of inactivity**
- First request after inactivity takes ~30 seconds (cold start)
- Subsequent requests are fast
- To avoid this: Upgrade to paid tier ($7/month) or use a cron job to ping your service

### Timeout Limits

- **Free tier**: 15-second timeout (might not work for very long AI requests)
- **Paid tier**: No timeout limits

💡 **Recommendation**: Start with free tier, upgrade to paid ($7/month) if you hit timeouts

## Testing Your Deployment

Once deployed, test these endpoints:

```bash
# Health check
curl https://your-app.onrender.com/health

# Root endpoint
curl https://your-app.onrender.com/

# Expected response:
# {"name":"Synapse AI API","version":"1.0.0","status":"running"}
```

## Update Frontend to Use Render

### For Vercel Deployment:

Add environment variable in Vercel dashboard:
```
VITE_API_BASE_URL=https://your-app.onrender.com
```

### For Local Development:

Update `.env.local`:
```
VITE_API_BASE_URL=https://your-app.onrender.com
```

Or keep using `http://localhost:3001` for local backend.

## CORS Configuration

The backend is already configured to accept requests from:
- ✅ All `.onrender.com` domains
- ✅ All `.vercel.app` domains
- ✅ Your Netlify domain
- ✅ Local development servers

See `server/index.ts` lines 30-47 for CORS configuration.

## Monitoring & Logs

### View Logs:
1. Go to your service dashboard
2. Click "Logs" tab
3. See real-time logs with color coding

### Metrics:
1. Click "Metrics" tab
2. View CPU, memory, and request metrics
3. Set up alerts (paid plans only)

## Auto-Deploy on Push

Render automatically deploys when you push to your main branch:

```bash
git add .
git commit -m "Update backend"
git push
```

Render detects the push and redeploys automatically (takes 2-3 minutes).

## Troubleshooting

### Build Fails

**Check TypeScript compilation:**
```bash
npm run build:server
```

**Common issues:**
- Missing dependencies in `package.json`
- TypeScript errors in server code
- Node version mismatch (ensure 20.x)

### Service Crashes on Start

**Check Render logs for errors:**
1. Go to service dashboard
2. Click "Logs"
3. Look for error messages after "Starting service..."

**Common issues:**
- Missing environment variables
- Port binding issues (Render sets `PORT` automatically)
- Database connection errors

### CORS Errors

**Verify:**
1. Backend is deployed and running (check health endpoint)
2. Frontend has correct `VITE_API_BASE_URL`
3. Check browser console for specific CORS error

**Fix:**
- Add your frontend domain to `allowedOrigins` in `server/index.ts`

### Timeouts (Free Tier)

If AI requests timeout on free tier:

**Options:**
1. Upgrade to paid tier ($7/month for no timeouts)
2. Optimize AI requests to finish faster
3. Use streaming responses (already implemented)
4. Switch to a different provider (Railway, Fly.io)

## Scaling & Performance

### Cold Starts (Free Tier Only)

After 15 minutes of inactivity, service spins down:
- Next request takes ~30s to wake up
- **Solution**: Upgrade to paid tier or use a cron job to ping every 10 minutes

### Horizontal Scaling (Paid Only)

On paid plans you can:
- Add more instances for redundancy
- Scale across multiple regions
- Handle more concurrent requests

## Cost Comparison

| Tier | Price | Hours | Timeout | Cold Starts |
|------|-------|-------|---------|-------------|
| Free | $0 | 750/mo | 15s | Yes (15 min) |
| Starter | $7/mo | Unlimited | None | No |
| Pro | $25/mo | Unlimited | None | No + extras |

## Migration from Railway

1. **Deploy to Render** (follow steps above)
2. **Test the Render URL** works
3. **Update frontend** environment variable
4. **Delete Railway service** (optional)

That's it! Your backend is now on Render.

## Support

- **Docs**: [render.com/docs](https://render.com/docs)
- **Community**: [community.render.com](https://community.render.com)
- **Status**: [status.render.com](https://status.render.com)

## Next Steps

1. ✅ Deploy backend to Render
2. ✅ Deploy frontend to Vercel
3. ✅ Update `VITE_API_BASE_URL` in Vercel
4. ✅ Test the application
5. 🎉 You're live!

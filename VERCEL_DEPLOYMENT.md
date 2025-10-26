# Vercel Frontend Deployment Guide

This guide will help you deploy the Synapse AI frontend to Vercel, with the backend running on Railway.

## Architecture

- **Frontend**: Vercel (React + Vite)
- **Backend**: Railway (Node.js + Express)

## Why Vercel + Railway?

- ✅ **Vercel**: Best-in-class frontend hosting with instant deployments and preview URLs
- ✅ **Railway**: Perfect for backend API with no timeout limits and streaming support
- ✅ **Great combo**: Both have excellent free tiers and work seamlessly together
- ✅ **CORS configured**: Backend automatically allows all `.vercel.app` domains

## Prerequisites

1. Railway backend deployed at: `https://hackathon-production-eead.up.railway.app`
2. GitHub repository connected

## Deployment Steps

### 1. Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub

### 2. Import Project

1. Click "Add New..." → "Project"
2. Select your `hackathon` repository
3. Vercel will auto-detect it as a Vite project

### 3. Configure Build Settings

Vercel should auto-detect these, but verify:

- **Framework Preset**: Vite
- **Build Command**: `vite build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 4. Configure Environment Variables

Add these environment variables in Vercel dashboard:

**Required:**
```
VITE_API_BASE_URL=https://hackathon-production-eead.up.railway.app
```

**Optional (if using ChatKit):**
```
VITE_CHATKIT_WORKFLOW_ID=your_workflow_id_here
```

### 5. Deploy

1. Click "Deploy"
2. Wait for deployment to complete (usually 1-2 minutes)
3. You'll get a URL like: `https://hackathon-your-username.vercel.app`

### 6. Test

1. Visit your Vercel URL
2. Test login/signup functionality
3. Test AI research features
4. Check browser console for any CORS errors (there shouldn't be any!)

## CORS Configuration

The Railway backend is already configured to accept requests from:
- All `.vercel.app` domains (production and preview deployments)
- Your Netlify domain (if still using it)
- Local development servers

See `server/index.ts` for the CORS configuration.

## Environment Variables

### Production (.env.production)
```bash
VITE_API_BASE_URL=https://hackathon-production-eead.up.railway.app
```

### Development (.env.local)
```bash
VITE_API_BASE_URL=http://localhost:3001
```

## Preview Deployments

Vercel automatically creates preview deployments for each pull request:
- Each preview gets its own URL: `https://hackathon-git-branch-name-your-username.vercel.app`
- Preview deployments automatically work with Railway backend (CORS configured)
- Perfect for testing before merging to production

## Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update Railway CORS if needed (add your custom domain to allowedOrigins)

## Monitoring

- **Vercel Dashboard**: View deployment logs, analytics, and performance
- **Railway Dashboard**: Monitor backend API logs and usage
- **Browser DevTools**: Check Network tab for API calls

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Verify build works locally: `npm run build`
- Check Vercel build logs for specific errors

### CORS Errors
- Verify Railway backend is deployed and running
- Check Railway logs for errors
- Ensure `VITE_API_BASE_URL` is set correctly in Vercel

### API Not Responding
- Check Railway deployment status
- Test Railway health endpoint: `https://hackathon-production-eead.up.railway.app/health`
- Verify environment variables in Railway dashboard

## Cost

Both services have generous free tiers:

**Vercel Free Tier:**
- 100GB bandwidth/month
- Unlimited deployments
- Automatic HTTPS
- Preview deployments

**Railway Free Tier:**
- $5/month credit
- More than enough for development

## Support

- **Vercel**: [docs.vercel.com](https://docs.vercel.com)
- **Railway**: [docs.railway.app](https://docs.railway.app)
- **Discord**: Both have active Discord communities

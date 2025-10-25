# ChatKit Integration Setup Guide

This guide will help you set up the OpenAI ChatKit interface for your research assistant application.

## Prerequisites

1. An OpenAI account with API access
2. Access to OpenAI ChatKit (currently in beta)

## Setup Steps

### 1. Create a ChatKit Workflow

1. Go to [OpenAI ChatKit Platform](https://platform.openai.com/chatkit)
2. Click "Create Workflow" or "New Workflow"
3. Configure your workflow with:
   - **Name**: Research Assistant
   - **Description**: AI assistant that helps researchers find papers, discover researchers, and analyze research trends
   - **Instructions**: Add instructions for how the assistant should behave (e.g., "You are a helpful research assistant that helps users find academic papers, discover researchers, and understand research trends.")
4. Configure available tools/functions if needed
5. Save your workflow and copy the **Workflow ID** (starts with `wf_`)

### 2. Configure Environment Variables

Open your `.env` file and update these values:

```bash
# OpenAI API Key (required for ChatKit)
OPENAI_API_KEY=your_actual_openai_api_key_here

# ChatKit Workflow ID (from step 1)
VITE_CHATKIT_WORKFLOW_ID=wf_your_workflow_id_here
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Build and Run

#### Development Mode

Run both the frontend and backend:

```bash
# Terminal 1 - Backend server
npm run dev:server

# Terminal 2 - Frontend
npm run dev
```

Or run both concurrently:

```bash
npm run dev:all
```

#### Production Mode

```bash
# Build everything
npm run build
npm run build:server

# Start server
npm run start:server

# Serve frontend (use a static server or deploy to hosting)
npm run preview
```

### 5. Verify Setup

1. Open your browser to `http://localhost:5173` (or your Vite dev port)
2. Navigate to the chat interface
3. You should see the ChatKit interface load
4. Try sending a message to test the connection

## Troubleshooting

### "Set VITE_CHATKIT_WORKFLOW_ID in your .env file"

- Make sure you've added `VITE_CHATKIT_WORKFLOW_ID` to your `.env` file
- Restart the dev server after updating `.env`

### "OpenAI API key not configured"

- Verify `OPENAI_API_KEY` is set in your `.env` file
- Restart the backend server

### "ChatKit web component is unavailable"

- Check your internet connection (the ChatKit script loads from CDN)
- Verify the script is loading in your browser's DevTools Network tab
- Check for any CORS or Content Security Policy issues

### Session Creation Fails

- Verify your OpenAI API key has access to ChatKit (it's currently in beta)
- Check the backend logs for detailed error messages
- Ensure your workflow ID is correct and the workflow is active

## Features

The ChatKit interface provides:

- **Professional Chat UI**: Modern, polished interface with smooth animations
- **File Upload**: Users can attach files to their messages
- **Dark/Light Mode**: Automatic theme switching based on system preferences
- **Starter Prompts**: Customized prompts to guide users on what they can ask
- **Error Handling**: Built-in error states and retry mechanisms
- **Mobile Responsive**: Works great on all device sizes

## Customization

### Starter Prompts

Edit `src/lib/config.ts` to customize the starter prompts:

```typescript
export const STARTER_PROMPTS: StartScreenPrompt[] = [
  {
    label: "Your Label",
    prompt: "The actual prompt to send",
    icon: "icon-name", // FontAwesome icon name
  },
];
```

### Greeting Message

```typescript
export const GREETING = "Your custom greeting message here";
```

### Theme Colors

Customize the theme in `getThemeConfig()` function in `src/lib/config.ts`.

## Backend Endpoint

The backend endpoint `/api/create-session` is implemented in:
- **File**: `server/routes/chatkit.routes.ts`
- **Method**: POST
- **Purpose**: Creates a ChatKit session and returns a client secret

This endpoint:
1. Receives workflow configuration from the frontend
2. Calls OpenAI's ChatKit API with your API key
3. Returns a session with a client_secret for the frontend to use

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Frontend  │────────>│ Your Backend │────────>│ OpenAI API  │
│  (ChatKit)  │         │  (Express)   │         │  (ChatKit)  │
└─────────────┘         └──────────────┘         └─────────────┘
      │                        │
      │                        │
      └────────────────────────┘
         Client Secret Flow
```

1. Frontend requests a session from your backend
2. Your backend calls OpenAI with your API key
3. OpenAI returns a client_secret
4. Your backend forwards it to the frontend
5. Frontend uses client_secret to communicate directly with OpenAI ChatKit

## Security Notes

- The OpenAI API key is NEVER exposed to the frontend
- All session creation happens on your backend
- Client secrets are scoped to individual sessions
- Configure CORS appropriately in production

## Next Steps

- Integrate your existing research paper search functionality with ChatKit workflows
- Add custom tools/functions to the workflow
- Implement user authentication and session persistence
- Add analytics and usage tracking

## Support

For issues with:
- **ChatKit**: [OpenAI ChatKit Documentation](https://platform.openai.com/docs/chatkit)
- **Your App**: Check the console logs and network tab for errors

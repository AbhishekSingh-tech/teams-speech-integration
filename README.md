# Teams OnPrem Speech-to-Speech Integration

This project integrates your existing Speech-to-Speech workflow with Microsoft Teams, enabling real-time audio processing during Teams calls.

## Architecture Overview

```
Teams Call → Teams Bot → Audio Bridge → Your WebSocket → NIM ASR → LLM → NIM TTS → WebSocket → Audio Bridge → Teams Call
```

## Components

1. **Teams Bot** - Handles Teams calls and manages audio streams
2. **Audio Bridge** - Routes audio between Teams and your existing websocket
3. **Configuration** - Teams app registration and settings management
4. **WebSocket Client** - Connects to your existing on-prem websocket

## Prerequisites

- Node.js 18+ and npm
- Microsoft Teams account with admin privileges
- Azure Bot Service (or local bot hosting)
- Your existing Speech-to-Speech websocket running on-prem
- Valid SSL certificate for production deployment

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Register Teams app:**
   ```bash
   npm run register-teams-app
   ```

4. **Start the bot:**
   ```bash
   npm start
   ```

5. **Deploy to Teams:**
   ```bash
   npm run deploy
   ```

## Configuration

### Environment Variables

- `BOT_ID` - Your Teams bot application ID
- `BOT_PASSWORD` - Your Teams bot password
- `WEBSOCKET_URL` - URL of your existing websocket
- `PORT` - Port for the bot server (default: 3978)
- `NODE_ENV` - Environment (development/production)

### Teams App Registration

The bot requires the following Teams permissions:
- `Calls.InitiateOutgoingCall`
- `Calls.JoinGroupCall`
- `Calls.AccessMedia`
- `Calls.InitiateGroupCall`

## Usage

1. **Start a call:** Users can start a call with the bot using Teams
2. **Audio processing:** The bot bridges audio to your existing websocket
3. **Real-time processing:** Your ASR → LLM → TTS pipeline processes the audio
4. **Response playback:** Processed audio is sent back to the Teams call

## Development

- `npm run dev` - Start in development mode with hot reload
- `npm test` - Run tests
- `npm run build` - Build for production

## Deployment

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed deployment instructions.

## Troubleshooting

See [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) for common issues and solutions. 
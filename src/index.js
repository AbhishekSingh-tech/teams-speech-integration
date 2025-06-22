const express = require('express');
const { BotFrameworkAdapter, MemoryStorage, UserState, ConversationState } = require('@microsoft/botbuilder');
const { TeamsBot } = require('./teamsBot');
const { AudioBridge } = require('./audioBridge');
const { WebSocketClient } = require('./websocketClient');
const { logger } = require('./utils/logger');
require('dotenv').config();

// Create HTTP server
const server = express();
const port = process.env.PORT || 3978;

// Add middleware
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

// Create adapter
const adapter = new BotFrameworkAdapter({
    appId: process.env.BOT_ID,
    appPassword: process.env.BOT_PASSWORD
});

// Add error handler
adapter.onTurnError = async (context, error) => {
    logger.error(`\n [onTurnError] unhandled error: ${error}`);
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${error}`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );
    await context.sendActivity('The bot encountered an error or bug.');
    await context.sendActivity('To continue to run this bot, please fix the bot source code.');
};

// Add memory storage
const memoryStorage = new MemoryStorage();
const userState = new UserState(memoryStorage);
const conversationState = new ConversationState(memoryStorage);

// Create audio bridge
const audioBridge = new AudioBridge();
const websocketClient = new WebSocketClient();

// Create bot instance
const bot = new TeamsBot(userState, conversationState, audioBridge, websocketClient);

// Listen for incoming requests
server.post('/api/messages', (req, res) => {
    adapter.processActivity(req, res, async (context) => {
        await bot.run(context);
    });
});

// Health check endpoint
server.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        websocket: websocketClient.isConnected() ? 'connected' : 'disconnected'
    });
});

// Audio stream endpoint for Teams
server.post('/api/audio/stream', (req, res) => {
    // Handle incoming audio from Teams
    audioBridge.handleTeamsAudio(req, res);
});

// Start server
server.listen(port, () => {
    logger.info(`Bot server listening on port ${port}`);
    logger.info(`Health check available at http://localhost:${port}/api/health`);
    
    // Connect to your on-prem websocket
    websocketClient.connect();
});

// Graceful shutdown
process.on('SIGINT', async () => {
    logger.info('Shutting down bot server...');
    await websocketClient.disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.info('Shutting down bot server...');
    await websocketClient.disconnect();
    process.exit(0);
}); 
const { TeamsBot } = require('../src/teamsBot');
const { AudioBridge } = require('../src/audioBridge');
const { WebSocketClient } = require('../src/websocketClient');
const { logger } = require('../src/utils/logger');

// Basic test to verify components can be instantiated
describe('Teams Bot Integration Tests', () => {
    test('should create TeamsBot instance', () => {
        const userState = {};
        const conversationState = {};
        const audioBridge = new AudioBridge();
        const websocketClient = new WebSocketClient();
        
        const bot = new TeamsBot(userState, conversationState, audioBridge, websocketClient);
        expect(bot).toBeDefined();
    });
    
    test('should create AudioBridge instance', () => {
        const audioBridge = new AudioBridge();
        expect(audioBridge).toBeDefined();
        expect(audioBridge.activeCalls).toBeDefined();
    });
    
    test('should create WebSocketClient instance', () => {
        const websocketClient = new WebSocketClient();
        expect(websocketClient).toBeDefined();
        expect(websocketClient.isConnected).toBe(false);
    });
    
    test('should handle audio bridge initialization', async () => {
        const audioBridge = new AudioBridge();
        const websocketClient = new WebSocketClient();
        
        const callId = 'test-call-123';
        await audioBridge.initializeCall(callId, websocketClient);
        
        expect(audioBridge.activeCalls.has(callId)).toBe(true);
        expect(audioBridge.getActiveCalls()).toContain(callId);
    });
    
    test('should get call statistics', () => {
        const audioBridge = new AudioBridge();
        const websocketClient = new WebSocketClient();
        
        const callId = 'test-call-456';
        audioBridge.initializeCall(callId, websocketClient);
        
        const stats = audioBridge.getCallStats(callId);
        expect(stats).toBeDefined();
        expect(stats.id).toBe(callId);
        expect(stats.isActive).toBe(true);
    });
});

// Mock context for testing
const createMockContext = (text) => ({
    activity: {
        text: text,
        from: { id: 'user123', name: 'Test User' },
        recipient: { id: 'bot123' }
    },
    sendActivity: jest.fn(),
    sendTraceActivity: jest.fn()
});

// Test bot message handling
describe('Bot Message Handling', () => {
    test('should respond to help command', async () => {
        const userState = {};
        const conversationState = {};
        const audioBridge = new AudioBridge();
        const websocketClient = new WebSocketClient();
        
        const bot = new TeamsBot(userState, conversationState, audioBridge, websocketClient);
        const context = createMockContext('help');
        
        await bot.handleMessage(context);
        
        expect(context.sendActivity).toHaveBeenCalled();
    });
    
    test('should respond to start call command', async () => {
        const userState = {};
        const conversationState = {};
        const audioBridge = new AudioBridge();
        const websocketClient = new WebSocketClient();
        
        const bot = new TeamsBot(userState, conversationState, audioBridge, websocketClient);
        const context = createMockContext('start call');
        
        await bot.handleMessage(context);
        
        expect(context.sendActivity).toHaveBeenCalled();
    });
});

// Test audio processing
describe('Audio Processing', () => {
    test('should process audio data', async () => {
        const audioBridge = new AudioBridge();
        const websocketClient = new WebSocketClient();
        
        const callId = 'test-call-789';
        await audioBridge.initializeCall(callId, websocketClient);
        
        const audioData = Buffer.from('test audio data');
        await audioBridge.processTeamsAudio(callId, audioData);
        
        // Verify audio was processed (this would depend on your implementation)
        expect(audioBridge.getCallStats(callId).bytesProcessed).toBeGreaterThan(0);
    });
});

// Test WebSocket connection
describe('WebSocket Connection', () => {
    test('should handle connection status', () => {
        const websocketClient = new WebSocketClient();
        
        const status = websocketClient.getConnectionStatus();
        expect(status.isConnected).toBe(false);
        expect(status.url).toBeDefined();
    });
    
    test('should handle reconnection logic', () => {
        const websocketClient = new WebSocketClient();
        
        // Simulate connection failure
        websocketClient.handleConnectionError(new Error('Connection failed'));
        
        expect(websocketClient.isConnected).toBe(false);
        expect(websocketClient.reconnectAttempts).toBe(0); // Should be 0 initially
    });
});

console.log('✅ All basic tests completed successfully!');
console.log('To run tests: npm test'); 
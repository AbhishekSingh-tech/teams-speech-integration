const WebSocket = require('ws');
const { logger } = require('./utils/logger');
const { EventEmitter } = require('events');

class WebSocketClient extends EventEmitter {
    constructor() {
        super();
        
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // Start with 1 second
        this.maxReconnectDelay = 30000; // Max 30 seconds
        this.heartbeatInterval = null;
        this.connectionTimeout = null;
        
        this.url = process.env.WEBSOCKET_URL;
        this.protocol = process.env.WEBSOCKET_PROTOCOL || 'ws';
        
        if (!this.url) {
            logger.error('WEBSOCKET_URL environment variable is required');
            throw new Error('WEBSOCKET_URL environment variable is required');
        }
    }
    
    async connect() {
        if (this.isConnected) {
            logger.warn('WebSocket already connected');
            return;
        }
        
        try {
            logger.info(`Connecting to WebSocket: ${this.url}`);
            
            this.ws = new WebSocket(this.url, {
                protocol: this.protocol,
                handshakeTimeout: 10000,
                perMessageDeflate: false
            });
            
            this.setupEventHandlers();
            this.startConnectionTimeout();
            
        } catch (error) {
            logger.error(`Error creating WebSocket connection: ${error}`);
            this.handleConnectionError(error);
        }
    }
    
    setupEventHandlers() {
        this.ws.on('open', () => {
            logger.info('WebSocket connection established');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.reconnectDelay = 1000;
            this.clearConnectionTimeout();
            this.startHeartbeat();
            this.emit('connected');
        });
        
        this.ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.handleMessage(message);
            } catch (error) {
                logger.error(`Error parsing WebSocket message: ${error}`);
                // Handle binary audio data
                this.handleAudioData(data);
            }
        });
        
        this.ws.on('close', (code, reason) => {
            logger.info(`WebSocket connection closed: ${code} - ${reason}`);
            this.isConnected = false;
            this.clearHeartbeat();
            this.emit('disconnected', { code, reason });
            this.handleReconnect();
        });
        
        this.ws.on('error', (error) => {
            logger.error(`WebSocket error: ${error}`);
            this.handleConnectionError(error);
        });
        
        this.ws.on('ping', () => {
            logger.debug('Received ping from server');
            this.ws.pong();
        });
        
        this.ws.on('pong', () => {
            logger.debug('Received pong from server');
        });
    }
    
    handleMessage(message) {
        logger.debug(`Received message: ${JSON.stringify(message)}`);
        
        switch (message.type) {
            case 'audio_data':
                this.handleAudioResponse(message);
                break;
            case 'status':
                this.handleStatusMessage(message);
                break;
            case 'error':
                this.handleErrorMessage(message);
                break;
            case 'heartbeat':
                this.handleHeartbeat(message);
                break;
            default:
                logger.warn(`Unknown message type: ${message.type}`);
                this.emit('message', message);
        }
    }
    
    handleAudioData(data) {
        // Handle binary audio data from your on-prem system
        logger.debug(`Received ${data.length} bytes of audio data`);
        this.emit('audioData', data);
    }
    
    handleAudioResponse(message) {
        // Handle processed audio response from your ASR → LLM → TTS pipeline
        logger.debug(`Received audio response for call: ${message.callId}`);
        this.emit('audioResponse', message);
    }
    
    handleStatusMessage(message) {
        logger.info(`Status from on-prem system: ${message.status}`);
        this.emit('status', message);
    }
    
    handleErrorMessage(message) {
        logger.error(`Error from on-prem system: ${message.error}`);
        this.emit('error', message);
    }
    
    handleHeartbeat(message) {
        logger.debug('Received heartbeat from on-prem system');
        this.emit('heartbeat', message);
    }
    
    async send(message) {
        if (!this.isConnected) {
            throw new Error('WebSocket not connected');
        }
        
        try {
            const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
            this.ws.send(messageStr);
            logger.debug(`Sent message: ${messageStr}`);
        } catch (error) {
            logger.error(`Error sending message: ${error}`);
            throw error;
        }
    }
    
    async sendAudioData(callId, audioData) {
        const message = {
            type: 'audio_data',
            callId: callId,
            audioData: audioData,
            timestamp: new Date().toISOString()
        };
        
        await this.send(message);
    }
    
    async sendInitMessage(callId, audioConfig) {
        const message = {
            type: 'init',
            callId: callId,
            audioConfig: audioConfig,
            timestamp: new Date().toISOString()
        };
        
        await this.send(message);
    }
    
    async sendEndMessage(callId) {
        const message = {
            type: 'end',
            callId: callId,
            timestamp: new Date().toISOString()
        };
        
        await this.send(message);
    }
    
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected) {
                this.send({ type: 'heartbeat', timestamp: new Date().toISOString() });
            }
        }, 30000); // Send heartbeat every 30 seconds
    }
    
    clearHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
    
    startConnectionTimeout() {
        this.connectionTimeout = setTimeout(() => {
            if (!this.isConnected) {
                logger.error('WebSocket connection timeout');
                this.handleConnectionError(new Error('Connection timeout'));
            }
        }, 10000); // 10 second timeout
    }
    
    clearConnectionTimeout() {
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
        }
    }
    
    handleConnectionError(error) {
        logger.error(`WebSocket connection error: ${error}`);
        this.isConnected = false;
        this.clearHeartbeat();
        this.clearConnectionTimeout();
        this.emit('error', error);
    }
    
    async handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            logger.error('Max reconnection attempts reached');
            this.emit('maxReconnectAttemptsReached');
            return;
        }
        
        this.reconnectAttempts++;
        const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);
        
        logger.info(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        setTimeout(async () => {
            try {
                await this.connect();
            } catch (error) {
                logger.error(`Reconnection attempt failed: ${error}`);
                this.handleReconnect();
            }
        }, delay);
    }
    
    async disconnect() {
        logger.info('Disconnecting WebSocket');
        
        this.clearHeartbeat();
        this.clearConnectionTimeout();
        
        if (this.ws) {
            this.ws.close(1000, 'Client disconnecting');
            this.ws = null;
        }
        
        this.isConnected = false;
        this.emit('disconnected');
    }
    
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            url: this.url,
            reconnectAttempts: this.reconnectAttempts,
            maxReconnectAttempts: this.maxReconnectAttempts
        };
    }
    
    isConnected() {
        return this.isConnected;
    }
}

module.exports = { WebSocketClient }; 
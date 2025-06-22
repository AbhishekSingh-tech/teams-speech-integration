const { logger } = require('./utils/logger');
const { v4: uuidv4 } = require('uuid');

class AudioBridge {
    constructor() {
        this.activeCalls = new Map();
        this.audioBuffers = new Map();
        this.sampleRate = parseInt(process.env.AUDIO_SAMPLE_RATE) || 16000;
        this.channels = parseInt(process.env.AUDIO_CHANNELS) || 1;
        this.bitDepth = parseInt(process.env.AUDIO_BIT_DEPTH) || 16;
    }
    
    async initializeCall(callId, websocketClient) {
        logger.info(`Initializing audio bridge for call: ${callId}`);
        
        const callSession = {
            id: callId,
            websocketClient: websocketClient,
            startTime: new Date(),
            audioBuffer: [],
            isActive: true,
            audioStream: null
        };
        
        this.activeCalls.set(callId, callSession);
        this.audioBuffers.set(callId, []);
        
        logger.info(`Audio bridge initialized for call: ${callId}`);
    }
    
    async startAudioStream(callId) {
        const callSession = this.activeCalls.get(callId);
        if (!callSession) {
            throw new Error(`Call session not found: ${callId}`);
        }
        
        logger.info(`Starting audio stream for call: ${callId}`);
        
        // Set up audio stream handling
        callSession.audioStream = {
            id: uuidv4(),
            startTime: new Date(),
            bytesProcessed: 0
        };
        
        // Initialize websocket audio stream
        await this.initializeWebSocketAudioStream(callId);
        
        logger.info(`Audio stream started for call: ${callId}`);
    }
    
    async initializeWebSocketAudioStream(callId) {
        const callSession = this.activeCalls.get(callId);
        if (!callSession) return;
        
        try {
            // Send initialization message to websocket
            const initMessage = {
                type: 'audio_stream_init',
                callId: callId,
                audioConfig: {
                    sampleRate: this.sampleRate,
                    channels: this.channels,
                    bitDepth: this.bitDepth,
                    format: 'pcm'
                },
                timestamp: new Date().toISOString()
            };
            
            await callSession.websocketClient.send(initMessage);
            logger.info(`WebSocket audio stream initialized for call: ${callId}`);
            
        } catch (error) {
            logger.error(`Error initializing WebSocket audio stream: ${error}`);
            throw error;
        }
    }
    
    async handleTeamsAudio(req, res) {
        const callId = req.headers['x-call-id'] || req.query.callId;
        if (!callId) {
            return res.status(400).json({ error: 'Call ID is required' });
        }
        
        const callSession = this.activeCalls.get(callId);
        if (!callSession) {
            return res.status(404).json({ error: 'Call session not found' });
        }
        
        try {
            // Get audio data from request
            const audioData = req.body || req.rawBody;
            if (!audioData) {
                return res.status(400).json({ error: 'Audio data is required' });
            }
            
            // Process and forward audio to websocket
            await this.processTeamsAudio(callId, audioData);
            
            res.status(200).json({ success: true, bytesProcessed: audioData.length });
            
        } catch (error) {
            logger.error(`Error handling Teams audio: ${error}`);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    async processTeamsAudio(callId, audioData) {
        const callSession = this.activeCalls.get(callId);
        if (!callSession) return;
        
        try {
            // Convert Teams audio format to your websocket format
            const processedAudio = await this.convertAudioFormat(audioData);
            
            // Send to websocket
            const audioMessage = {
                type: 'audio_data',
                callId: callId,
                audioData: processedAudio,
                timestamp: new Date().toISOString(),
                sequence: callSession.audioStream?.bytesProcessed || 0
            };
            
            await callSession.websocketClient.send(audioMessage);
            
            // Update statistics
            if (callSession.audioStream) {
                callSession.audioStream.bytesProcessed += audioData.length;
            }
            
            logger.debug(`Processed ${audioData.length} bytes of Teams audio for call: ${callId}`);
            
        } catch (error) {
            logger.error(`Error processing Teams audio: ${error}`);
            throw error;
        }
    }
    
    async handleWebSocketAudio(callId, audioData) {
        const callSession = this.activeCalls.get(callId);
        if (!callSession) {
            logger.warn(`Received audio for unknown call: ${callId}`);
            return;
        }
        
        try {
            // Convert websocket audio format to Teams format
            const teamsAudio = await this.convertToTeamsFormat(audioData);
            
            // Send audio back to Teams
            await this.sendAudioToTeams(callId, teamsAudio);
            
            logger.debug(`Sent ${teamsAudio.length} bytes of processed audio to Teams for call: ${callId}`);
            
        } catch (error) {
            logger.error(`Error handling WebSocket audio: ${error}`);
        }
    }
    
    async convertAudioFormat(audioData) {
        // Convert Teams audio format to your websocket format
        // This is a placeholder - implement based on your specific audio format requirements
        
        // Teams typically sends audio in:
        // - Sample rate: 16kHz
        // - Channels: 1 (mono)
        // - Bit depth: 16-bit
        // - Format: PCM
        
        // Your websocket might expect different format
        // Implement conversion logic here
        
        return audioData; // Placeholder - return as-is for now
    }
    
    async convertToTeamsFormat(audioData) {
        // Convert your websocket audio format to Teams format
        // This is a placeholder - implement based on your specific audio format requirements
        
        return audioData; // Placeholder - return as-is for now
    }
    
    async sendAudioToTeams(callId, audioData) {
        // This would typically involve sending audio back to Teams via the Bot Framework
        // Implementation depends on your Teams bot configuration
        
        logger.debug(`Sending audio to Teams for call: ${callId}`);
        
        // Placeholder implementation
        // In a real implementation, you would:
        // 1. Use Teams Bot Framework audio APIs
        // 2. Send audio through the appropriate Teams media stream
        // 3. Handle audio playback in the Teams client
    }
    
    async endCall(callId) {
        logger.info(`Ending audio bridge for call: ${callId}`);
        
        const callSession = this.activeCalls.get(callId);
        if (!callSession) {
            logger.warn(`Call session not found for ending: ${callId}`);
            return;
        }
        
        try {
            // Send end message to websocket
            const endMessage = {
                type: 'audio_stream_end',
                callId: callId,
                timestamp: new Date().toISOString(),
                duration: new Date() - callSession.startTime,
                bytesProcessed: callSession.audioStream?.bytesProcessed || 0
            };
            
            await callSession.websocketClient.send(endMessage);
            
            // Clean up
            callSession.isActive = false;
            this.activeCalls.delete(callId);
            this.audioBuffers.delete(callId);
            
            logger.info(`Audio bridge ended for call: ${callId}`);
            
        } catch (error) {
            logger.error(`Error ending call: ${error}`);
        }
    }
    
    getActiveCalls() {
        return Array.from(this.activeCalls.keys());
    }
    
    getCallStats(callId) {
        const callSession = this.activeCalls.get(callId);
        if (!callSession) return null;
        
        return {
            id: callId,
            startTime: callSession.startTime,
            isActive: callSession.isActive,
            duration: new Date() - callSession.startTime,
            bytesProcessed: callSession.audioStream?.bytesProcessed || 0
        };
    }
}

module.exports = { AudioBridge }; 
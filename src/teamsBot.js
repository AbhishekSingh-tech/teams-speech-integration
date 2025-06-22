const { ActivityHandler, TurnContext } = require('@microsoft/botbuilder');
const { TeamsActivityHandler, TeamsInfo } = require('@microsoft/botbuilder-teams');
const { logger } = require('./utils/logger');

class TeamsBot extends TeamsActivityHandler {
    constructor(userState, conversationState, audioBridge, websocketClient) {
        super();
        
        this.userState = userState;
        this.conversationState = conversationState;
        this.audioBridge = audioBridge;
        this.websocketClient = websocketClient;
        
        this.userProfileAccessor = userState.createProperty('userProfile');
        this.conversationDataAccessor = conversationState.createProperty('conversationData');
        
        // Handle message activities
        this.onMessage(async (context, next) => {
            await this.handleMessage(context);
            await next();
        });
        
        // Handle conversation update activities
        this.onConversationUpdate(async (context, next) => {
            await this.handleConversationUpdate(context);
            await next();
        });
        
        // Handle Teams call events
        this.onTeamsCallStart(async (call, context, next) => {
            await this.handleCallStart(call, context);
            await next();
        });
        
        this.onTeamsCallEnd(async (call, context, next) => {
            await this.handleCallEnd(call, context);
            await next();
        });
        
        // Handle Teams meeting events
        this.onTeamsMeetingStart(async (meeting, context, next) => {
            await this.handleMeetingStart(meeting, context);
            await next();
        });
        
        this.onTeamsMeetingEnd(async (meeting, context, next) => {
            await this.handleMeetingEnd(meeting, context);
            await next();
        });
    }
    
    async run(context) {
        await super.run(context);
        
        // Save state changes
        await this.conversationState.saveChanges(context, false);
        await this.userState.saveChanges(context, false);
    }
    
    async handleMessage(context) {
        const text = context.activity.text.toLowerCase();
        const conversationData = await this.conversationDataAccessor.get(context, {});
        
        logger.info(`Message received: ${text}`);
        
        if (text.includes('start call') || text.includes('call')) {
            await this.startCall(context);
        } else if (text.includes('join meeting') || text.includes('meeting')) {
            await this.joinMeeting(context);
        } else if (text.includes('help')) {
            await this.showHelp(context);
        } else {
            await context.sendActivity('I can help you start calls or join meetings. Type "help" for more information.');
        }
    }
    
    async handleConversationUpdate(context) {
        if (context.activity.membersAdded && context.activity.membersAdded.length > 0) {
            for (const member of context.activity.membersAdded) {
                if (member.id !== context.activity.recipient.id) {
                    await context.sendActivity('Welcome to the Speech-to-Speech Teams Bot! I can help you start calls and process audio through your on-prem system.');
                    await this.showHelp(context);
                }
            }
        }
    }
    
    async handleCallStart(call, context) {
        logger.info(`Call started: ${call.id}`);
        
        try {
            // Initialize audio bridge for this call
            await this.audioBridge.initializeCall(call.id, this.websocketClient);
            
            await context.sendActivity(`Call started! Audio is now being processed through your on-prem Speech-to-Speech system.`);
            
            // Start audio streaming
            await this.audioBridge.startAudioStream(call.id);
            
        } catch (error) {
            logger.error(`Error handling call start: ${error}`);
            await context.sendActivity('Sorry, there was an error starting the audio processing.');
        }
    }
    
    async handleCallEnd(call, context) {
        logger.info(`Call ended: ${call.id}`);
        
        try {
            // Clean up audio bridge for this call
            await this.audioBridge.endCall(call.id);
            
            await context.sendActivity('Call ended. Audio processing has been stopped.');
            
        } catch (error) {
            logger.error(`Error handling call end: ${error}`);
        }
    }
    
    async handleMeetingStart(meeting, context) {
        logger.info(`Meeting started: ${meeting.id}`);
        
        try {
            // Initialize audio bridge for this meeting
            await this.audioBridge.initializeCall(meeting.id, this.websocketClient);
            
            await context.sendActivity(`Meeting started! Audio is now being processed through your on-prem Speech-to-Speech system.`);
            
            // Start audio streaming
            await this.audioBridge.startAudioStream(meeting.id);
            
        } catch (error) {
            logger.error(`Error handling meeting start: ${error}`);
            await context.sendActivity('Sorry, there was an error starting the audio processing.');
        }
    }
    
    async handleMeetingEnd(meeting, context) {
        logger.info(`Meeting ended: ${meeting.id}`);
        
        try {
            // Clean up audio bridge for this meeting
            await this.audioBridge.endCall(meeting.id);
            
            await context.sendActivity('Meeting ended. Audio processing has been stopped.');
            
        } catch (error) {
            logger.error(`Error handling meeting end: ${error}`);
        }
    }
    
    async startCall(context) {
        try {
            const call = {
                id: `call_${Date.now()}`,
                type: 'call',
                participants: [context.activity.from]
            };
            
            await this.handleCallStart(call, context);
            
        } catch (error) {
            logger.error(`Error starting call: ${error}`);
            await context.sendActivity('Sorry, there was an error starting the call.');
        }
    }
    
    async joinMeeting(context) {
        try {
            const meeting = {
                id: `meeting_${Date.now()}`,
                type: 'meeting',
                participants: [context.activity.from]
            };
            
            await this.handleMeetingStart(meeting, context);
            
        } catch (error) {
            logger.error(`Error joining meeting: ${error}`);
            await context.sendActivity('Sorry, there was an error joining the meeting.');
        }
    }
    
    async showHelp(context) {
        const helpText = `
**Speech-to-Speech Teams Bot Help**

I can help you integrate your on-prem Speech-to-Speech system with Teams calls.

**Commands:**
- "start call" - Start a new call with audio processing
- "join meeting" - Join a meeting with audio processing
- "help" - Show this help message

**How it works:**
1. Start a call or join a meeting
2. Your audio will be sent to your on-prem websocket
3. The audio goes through: ASR → LLM → TTS
4. The processed audio is sent back to the Teams call

**Requirements:**
- Your on-prem websocket must be running
- Valid bot credentials configured
- Teams app properly registered

For technical support, check the logs or contact your administrator.
        `;
        
        await context.sendActivity(helpText);
    }
}

module.exports = { TeamsBot }; 
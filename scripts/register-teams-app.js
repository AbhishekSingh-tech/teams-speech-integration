#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { logger } = require('../src/utils/logger');

/**
 * Teams App Registration Helper
 * 
 * This script helps you register your bot with Microsoft Teams.
 * You'll need to manually complete some steps in the Azure Portal.
 */

console.log('🚀 Teams App Registration Helper');
console.log('================================\n');

console.log('This script will help you register your bot with Microsoft Teams.');
console.log('Follow these steps:\n');

console.log('1. 📋 PREREQUISITES:');
console.log('   - Microsoft 365 Developer Account');
console.log('   - Azure Subscription (free tier works)');
console.log('   - Your bot server running (use ngrok for local development)\n');

console.log('2. 🔧 AZURE BOT SERVICE SETUP:');
console.log('   a) Go to https://portal.azure.com');
console.log('   b) Create a new "Bot Channels Registration" resource');
console.log('   c) Choose "Create new" for Microsoft App ID');
console.log('   d) Set messaging endpoint to: https://your-domain.com/api/messages');
console.log('   e) Save the Bot ID and Bot Password\n');

console.log('3. 🏢 TEAMS APP REGISTRATION:');
console.log('   a) Go to https://dev.teams.microsoft.com/apps');
console.log('   b) Click "New app"');
console.log('   c) Fill in basic information:');
console.log('      - App name: Speech-to-Speech Bot');
console.log('      - App ID: Use the same ID from Azure Bot Service');
console.log('      - App description: Teams integration for on-prem speech processing\n');

console.log('4. ⚙️ CONFIGURE CAPABILITIES:');
console.log('   a) Go to "Capabilities" section');
console.log('   b) Enable "Bots"');
console.log('   c) Add bot with the same App ID');
console.log('   d) Enable "Calls and online meetings"');
console.log('   e) Add the following permissions:');
console.log('      - Calls.InitiateOutgoingCall');
console.log('      - Calls.JoinGroupCall');
console.log('      - Calls.AccessMedia');
console.log('      - Calls.InitiateGroupCall\n');

console.log('5. 🔐 CONFIGURE AUTHENTICATION:');
console.log('   a) Go to "Authentication" section');
console.log('   b) Add redirect URI: https://your-domain.com/auth-endpoint');
console.log('   c) Add logout URI: https://your-domain.com/logout\n');

console.log('6. 📦 CREATE APP PACKAGE:');
console.log('   a) Go to "App package" section');
console.log('   b) Download the manifest file');
console.log('   c) Update the manifest with your bot details');
console.log('   d) Upload the updated manifest\n');

console.log('7. 🚀 DEPLOY TO TEAMS:');
console.log('   a) Go to "Publish" section');
console.log('   b) Choose "Publish to your organization"');
console.log('   c) Submit for review\n');

console.log('8. ⚙️ UPDATE ENVIRONMENT VARIABLES:');
console.log('   Copy your .env.example to .env and update:');
console.log('   - BOT_ID: Your Azure Bot App ID');
console.log('   - BOT_PASSWORD: Your Azure Bot Password');
console.log('   - WEBSOCKET_URL: Your on-prem websocket URL\n');

console.log('9. 🧪 TEST THE INTEGRATION:');
console.log('   a) Start your bot server: npm start');
console.log('   b) Add the bot to a Teams chat');
console.log('   c) Type "start call" to test audio processing\n');

console.log('📝 MANIFEST TEMPLATE:');
console.log('Here\'s a basic manifest.json template:\n');

const manifestTemplate = {
    "$schema": "https://developer.microsoft.com/en-us/json-schemas/teams/v1.14/MicrosoftTeams.schema.json",
    "manifestVersion": "1.14",
    "version": "1.0.0",
    "id": "{{BOT_APP_ID}}",
    "packageName": "com.yourcompany.teams-speech-bot",
    "developer": {
        "name": "Your Company",
        "websiteUrl": "https://yourcompany.com",
        "privacyUrl": "https://yourcompany.com/privacy",
        "termsOfUseUrl": "https://yourcompany.com/terms"
    },
    "name": {
        "short": "Speech Bot",
        "full": "Speech-to-Speech Teams Bot"
    },
    "description": {
        "short": "Integrates on-prem speech processing with Teams",
        "full": "This bot integrates your on-prem Speech-to-Speech workflow with Microsoft Teams calls and meetings."
    },
    "icons": {
        "outline": "outline.png",
        "color": "color.png"
    },
    "accentColor": "#FFFFFF",
    "bots": [
        {
            "botId": "{{BOT_APP_ID}}",
            "scopes": [
                "personal",
                "team",
                "groupchat"
            ],
            "supportsFiles": false,
            "isNotificationOnly": false
        }
    ],
    "permissions": [
        "identity",
        "messageTeamMembers"
    ],
    "validDomains": [
        "your-domain.com"
    ],
    "webApplicationInfo": {
        "id": "{{BOT_APP_ID}}",
        "resource": "https://your-domain.com"
    }
};

console.log(JSON.stringify(manifestTemplate, null, 2));

console.log('\n📞 SUPPORT:');
console.log('If you encounter issues:');
console.log('- Check the logs: tail -f logs/combined.log');
console.log('- Verify WebSocket connection: curl http://localhost:3978/api/health');
console.log('- Test Teams integration in the Teams client\n');

console.log('✅ Registration process completed!');
console.log('Your bot should now be ready to handle Teams calls with audio processing.\n');

// Create a basic .env file if it doesn't exist
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
    console.log('📝 Creating .env file from template...');
    const envExamplePath = path.join(process.cwd(), 'env.example');
    if (fs.existsSync(envExamplePath)) {
        fs.copyFileSync(envExamplePath, envPath);
        console.log('✅ .env file created. Please update it with your actual values.');
    }
}

console.log('🎉 Setup complete! Run "npm start" to start your bot.'); 
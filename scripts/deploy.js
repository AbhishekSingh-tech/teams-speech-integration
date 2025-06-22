#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Deployment Helper Script
 * 
 * This script helps deploy your Teams bot to production.
 */

console.log('🚀 Teams Bot Deployment Helper');
console.log('==============================\n');

console.log('This script will help you deploy your bot to production.');
console.log('Choose your deployment method:\n');

console.log('1. 🌐 AZURE APP SERVICE (Recommended)');
console.log('   - Easy deployment with Git integration');
console.log('   - Automatic SSL certificates');
console.log('   - Built-in monitoring and scaling\n');

console.log('2. 🐳 DOCKER CONTAINER');
console.log('   - Deploy anywhere Docker runs');
console.log('   - Consistent environment');
console.log('   - Easy scaling\n');

console.log('3. 🖥️  ON-PREMISES SERVER');
console.log('   - Full control over infrastructure');
console.log('   - Custom networking setup');
console.log('   - Requires SSL certificate\n');

console.log('4. ☁️  OTHER CLOUD PROVIDERS');
console.log('   - AWS, Google Cloud, etc.');
console.log('   - Similar to Azure App Service\n');

// Check if user wants to proceed
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Which deployment method would you like to use? (1-4): ', (answer) => {
    switch(answer.trim()) {
        case '1':
            deployToAzure();
            break;
        case '2':
            deployWithDocker();
            break;
        case '3':
            deployOnPremises();
            break;
        case '4':
            deployOtherCloud();
            break;
        default:
            console.log('Invalid choice. Please run the script again.');
    }
    rl.close();
});

function deployToAzure() {
    console.log('\n🌐 AZURE APP SERVICE DEPLOYMENT');
    console.log('===============================\n');
    
    console.log('1. 📋 PREREQUISITES:');
    console.log('   - Azure CLI installed: az --version');
    console.log('   - Azure subscription');
    console.log('   - Git repository for your bot\n');
    
    console.log('2. 🔧 AZURE CLI SETUP:');
    console.log('   az login');
    console.log('   az account set --subscription <your-subscription-id>\n');
    
    console.log('3. 🏗️  CREATE APP SERVICE:');
    console.log('   az group create --name teams-bot-rg --location eastus');
    console.log('   az appservice plan create --name teams-bot-plan --resource-group teams-bot-rg --sku B1');
    console.log('   az webapp create --name your-teams-bot --resource-group teams-bot-rg --plan teams-bot-plan --runtime "NODE|18-lts"\n');
    
    console.log('4. ⚙️  CONFIGURE ENVIRONMENT:');
    console.log('   az webapp config appsettings set --name your-teams-bot --resource-group teams-bot-rg --settings NODE_ENV=production');
    console.log('   az webapp config appsettings set --name your-teams-bot --resource-group teams-bot-rg --settings BOT_ID=<your-bot-id>');
    console.log('   az webapp config appsettings set --name your-teams-bot --resource-group teams-bot-rg --settings BOT_PASSWORD=<your-bot-password>');
    console.log('   az webapp config appsettings set --name your-teams-bot --resource-group teams-bot-rg --settings WEBSOCKET_URL=<your-websocket-url>\n');
    
    console.log('5. 🚀 DEPLOY CODE:');
    console.log('   git add .');
    console.log('   git commit -m "Deploy to Azure"');
    console.log('   git push azure main\n');
    
    console.log('6. 🔗 UPDATE TEAMS APP:');
    console.log('   Update your Teams app manifest with the new endpoint:');
    console.log('   https://your-teams-bot.azurewebsites.net/api/messages\n');
    
    console.log('✅ Azure deployment complete!');
}

function deployWithDocker() {
    console.log('\n🐳 DOCKER DEPLOYMENT');
    console.log('===================\n');
    
    console.log('1. 📋 PREREQUISITES:');
    console.log('   - Docker installed');
    console.log('   - Docker Hub account (or other registry)');
    console.log('   - Server with Docker support\n');
    
    console.log('2. 🐳 CREATE DOCKERFILE:');
    console.log('Creating Dockerfile...\n');
    
    const dockerfile = `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3978

CMD ["npm", "start"]`;
    
    fs.writeFileSync('Dockerfile', dockerfile);
    console.log('✅ Dockerfile created\n');
    
    console.log('3. 🏗️  BUILD DOCKER IMAGE:');
    console.log('   docker build -t teams-speech-bot .\n');
    
    console.log('4. 🚀 RUN CONTAINER:');
    console.log('   docker run -d \\');
    console.log('     --name teams-bot \\');
    console.log('     -p 3978:3978 \\');
    console.log('     -e BOT_ID=<your-bot-id> \\');
    console.log('     -e BOT_PASSWORD=<your-bot-password> \\');
    console.log('     -e WEBSOCKET_URL=<your-websocket-url> \\');
    console.log('     -e NODE_ENV=production \\');
    console.log('     teams-speech-bot\n');
    
    console.log('5. 🔄 DOCKER COMPOSE (Optional):');
    console.log('Creating docker-compose.yml...\n');
    
    const dockerCompose = `version: '3.8'

services:
  teams-bot:
    build: .
    ports:
      - "3978:3978"
    environment:
      - BOT_ID=\${BOT_ID}
      - BOT_PASSWORD=\${BOT_PASSWORD}
      - WEBSOCKET_URL=\${WEBSOCKET_URL}
      - NODE_ENV=production
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs`;
    
    fs.writeFileSync('docker-compose.yml', dockerCompose);
    console.log('✅ docker-compose.yml created\n');
    
    console.log('6. 🚀 DEPLOY WITH COMPOSE:');
    console.log('   docker-compose up -d\n');
    
    console.log('✅ Docker deployment complete!');
}

function deployOnPremises() {
    console.log('\n🖥️  ON-PREMISES DEPLOYMENT');
    console.log('==========================\n');
    
    console.log('1. 📋 PREREQUISITES:');
    console.log('   - Linux/Windows server');
    console.log('   - Node.js 18+ installed');
    console.log('   - SSL certificate');
    console.log('   - Reverse proxy (nginx/apache)\n');
    
    console.log('2. 🔧 SERVER SETUP:');
    console.log('   # Install Node.js');
    console.log('   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -');
    console.log('   sudo apt-get install -y nodejs\n');
    
    console.log('3. 📁 DEPLOY CODE:');
    console.log('   git clone <your-repo> /opt/teams-bot');
    console.log('   cd /opt/teams-bot');
    console.log('   npm install --production\n');
    
    console.log('4. ⚙️  CONFIGURE ENVIRONMENT:');
    console.log('   cp env.example .env');
    console.log('   # Edit .env with your settings\n');
    
    console.log('5. 🔄 SETUP SYSTEMD SERVICE:');
    console.log('Creating systemd service file...\n');
    
    const systemdService = `[Unit]
Description=Teams Speech Bot
After=network.target

[Service]
Type=simple
User=teams-bot
WorkingDirectory=/opt/teams-bot
Environment=NODE_ENV=production
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target`;
    
    fs.writeFileSync('teams-bot.service', systemdService);
    console.log('✅ teams-bot.service created\n');
    
    console.log('6. 🚀 START SERVICE:');
    console.log('   sudo cp teams-bot.service /etc/systemd/system/');
    console.log('   sudo systemctl daemon-reload');
    console.log('   sudo systemctl enable teams-bot');
    console.log('   sudo systemctl start teams-bot\n');
    
    console.log('7. 🌐 REVERSE PROXY SETUP:');
    console.log('   # Configure nginx/apache to proxy to localhost:3978');
    console.log('   # Set up SSL certificate\n');
    
    console.log('✅ On-premises deployment complete!');
}

function deployOtherCloud() {
    console.log('\n☁️  OTHER CLOUD DEPLOYMENT');
    console.log('==========================\n');
    
    console.log('The deployment process is similar to Azure App Service:');
    console.log('1. Create a compute instance (VM, container, or serverless)');
    console.log('2. Deploy your Node.js application');
    console.log('3. Configure environment variables');
    console.log('4. Set up SSL and domain');
    console.log('5. Update Teams app manifest\n');
    
    console.log('Common platforms:');
    console.log('- AWS Elastic Beanstalk');
    console.log('- Google Cloud Run');
    console.log('- Heroku');
    console.log('- DigitalOcean App Platform');
    console.log('- Vercel (with limitations)\n');
    
    console.log('Refer to your chosen platform\'s documentation for specific steps.');
}

console.log('\n📞 POST-DEPLOYMENT:');
console.log('1. Test your bot endpoint: curl https://your-domain.com/api/health');
console.log('2. Verify WebSocket connection');
console.log('3. Test Teams integration');
console.log('4. Monitor logs for any issues\n');

console.log('🎉 Deployment guide complete!');
console.log('Choose your deployment method and follow the steps above.'); 
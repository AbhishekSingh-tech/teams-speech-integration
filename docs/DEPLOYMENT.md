# Deployment Guide

This guide covers deploying your Teams Speech-to-Speech bot to various environments.

## Prerequisites

- Node.js 18+ installed
- Git repository for your bot
- Microsoft 365 Developer Account
- Azure subscription (for cloud deployment)
- SSL certificate (for production)

## Local Development

### 1. Setup Environment

```bash
# Clone the repository
git clone <your-repo>
cd teams-onprem-speech-integration

# Install dependencies
npm install

# Copy environment template
cp env.example .env

# Edit .env with your settings
nano .env
```

### 2. Configure Environment Variables

```bash
# Required settings
BOT_ID=your-bot-app-id-here
BOT_PASSWORD=your-bot-password-here
WEBSOCKET_URL=ws://your-onprem-server:port/websocket

# Optional settings
PORT=3978
NODE_ENV=development
LOG_LEVEL=debug
```

### 3. Start Development Server

```bash
# Start with hot reload
npm run dev

# Or start production mode
npm start
```

### 4. Test Locally with Ngrok

```bash
# Install ngrok
npm install -g ngrok

# Start ngrok tunnel
ngrok http 3978

# Update your bot endpoint in Azure with the ngrok URL
# https://your-ngrok-url.ngrok.io/api/messages
```

## Azure App Service Deployment

### 1. Azure CLI Setup

```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login to Azure
az login

# Set subscription
az account set --subscription <your-subscription-id>
```

### 2. Create Azure Resources

```bash
# Create resource group
az group create --name teams-bot-rg --location eastus

# Create app service plan
az appservice plan create \
  --name teams-bot-plan \
  --resource-group teams-bot-rg \
  --sku B1 \
  --is-linux

# Create web app
az webapp create \
  --name your-teams-bot \
  --resource-group teams-bot-rg \
  --plan teams-bot-plan \
  --runtime "NODE|18-lts"
```

### 3. Configure Environment Variables

```bash
# Set environment variables
az webapp config appsettings set \
  --name your-teams-bot \
  --resource-group teams-bot-rg \
  --settings \
    NODE_ENV=production \
    BOT_ID=<your-bot-id> \
    BOT_PASSWORD=<your-bot-password> \
    WEBSOCKET_URL=<your-websocket-url> \
    LOG_LEVEL=info
```

### 4. Deploy Code

```bash
# Add Azure remote
az webapp deployment source config-local-git \
  --name your-teams-bot \
  --resource-group teams-bot-rg

# Get deployment URL
az webapp deployment list-publishing-credentials \
  --name your-teams-bot \
  --resource-group teams-bot-rg

# Deploy
git add .
git commit -m "Deploy to Azure"
git push azure main
```

### 5. Update Teams App

Update your Teams app manifest with the new endpoint:
```
https://your-teams-bot.azurewebsites.net/api/messages
```

## Docker Deployment

### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3978

CMD ["npm", "start"]
```

### 2. Build and Run

```bash
# Build image
docker build -t teams-speech-bot .

# Run container
docker run -d \
  --name teams-bot \
  -p 3978:3978 \
  -e BOT_ID=<your-bot-id> \
  -e BOT_PASSWORD=<your-bot-password> \
  -e WEBSOCKET_URL=<your-websocket-url> \
  -e NODE_ENV=production \
  teams-speech-bot
```

### 3. Docker Compose (Recommended)

```yaml
version: '3.8'

services:
  teams-bot:
    build: .
    ports:
      - "3978:3978"
    environment:
      - BOT_ID=${BOT_ID}
      - BOT_PASSWORD=${BOT_PASSWORD}
      - WEBSOCKET_URL=${WEBSOCKET_URL}
      - NODE_ENV=production
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
```

```bash
# Start with compose
docker-compose up -d

# View logs
docker-compose logs -f
```

## On-Premises Deployment

### 1. Server Setup

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Create user
sudo useradd -m -s /bin/bash teams-bot
sudo usermod -aG sudo teams-bot
```

### 2. Deploy Application

```bash
# Clone repository
sudo git clone <your-repo> /opt/teams-bot
sudo chown -R teams-bot:teams-bot /opt/teams-bot

# Install dependencies
cd /opt/teams-bot
sudo -u teams-bot npm install --production
```

### 3. Configure Environment

```bash
# Copy environment file
sudo -u teams-bot cp env.example .env

# Edit configuration
sudo -u teams-bot nano .env
```

### 4. Systemd Service

```bash
# Create service file
sudo tee /etc/systemd/system/teams-bot.service << EOF
[Unit]
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
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable teams-bot
sudo systemctl start teams-bot

# Check status
sudo systemctl status teams-bot
```

### 5. Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3978;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Monitoring and Logs

### 1. Application Logs

```bash
# View application logs
tail -f logs/combined.log

# View error logs
tail -f logs/error.log

# Docker logs
docker logs -f teams-bot

# Systemd logs
sudo journalctl -u teams-bot -f
```

### 2. Health Checks

```bash
# Check bot health
curl https://your-domain.com/api/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "websocket": "connected"
}
```

### 3. Metrics

Monitor these key metrics:
- Bot response time
- WebSocket connection status
- Audio processing latency
- Error rates
- Call duration

## Troubleshooting

### Common Issues

1. **Bot not responding**
   - Check bot credentials in .env
   - Verify Teams app registration
   - Check application logs

2. **WebSocket connection failed**
   - Verify WEBSOCKET_URL is correct
   - Check network connectivity
   - Ensure on-prem server is running

3. **Audio not processing**
   - Check audio format compatibility
   - Verify NIM services are running
   - Check audio bridge logs

4. **Teams integration issues**
   - Verify bot permissions in Teams
   - Check manifest configuration
   - Ensure SSL certificate is valid

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=debug
npm start

# Or in production
LOG_LEVEL=debug npm start
```

## Security Considerations

1. **Environment Variables**
   - Never commit .env files
   - Use secure secret management
   - Rotate credentials regularly

2. **Network Security**
   - Use HTTPS in production
   - Implement proper firewall rules
   - Secure WebSocket connections

3. **Access Control**
   - Limit bot permissions
   - Monitor access logs
   - Implement rate limiting

## Scaling

### Horizontal Scaling

```bash
# Multiple instances behind load balancer
# Update nginx configuration for load balancing
upstream teams_bot {
    server 127.0.0.1:3978;
    server 127.0.0.1:3979;
    server 127.0.0.1:3980;
}
```

### Vertical Scaling

```bash
# Increase Azure App Service plan
az appservice plan update \
  --name teams-bot-plan \
  --resource-group teams-bot-rg \
  --sku S2

# Or scale Docker containers
docker-compose up --scale teams-bot=3
```

## Backup and Recovery

### 1. Configuration Backup

```bash
# Backup environment configuration
cp .env .env.backup

# Backup logs
tar -czf logs-backup-$(date +%Y%m%d).tar.gz logs/
```

### 2. Database Backup (if applicable)

```bash
# Backup any persistent data
# This depends on your storage solution
```

### 3. Recovery Procedures

```bash
# Restore from backup
cp .env.backup .env

# Restart service
sudo systemctl restart teams-bot

# Verify recovery
curl https://your-domain.com/api/health
``` 
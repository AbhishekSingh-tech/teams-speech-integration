# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with your Teams Speech-to-Speech bot integration.

## Quick Diagnostics

### 1. Health Check

```bash
# Check if bot is running
curl http://localhost:3978/api/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "websocket": "connected"
}
```

### 2. Log Analysis

```bash
# View recent logs
tail -f logs/combined.log

# View errors only
tail -f logs/error.log

# Search for specific errors
grep "ERROR" logs/combined.log
```

### 3. Environment Check

```bash
# Verify environment variables
node -e "require('dotenv').config(); console.log(process.env.BOT_ID, process.env.WEBSOCKET_URL)"

# Check Node.js version
node --version  # Should be 18+

# Check npm packages
npm list --depth=0
```

## Common Issues and Solutions

### Bot Not Responding

**Symptoms:**
- Bot doesn't reply to messages in Teams
- Teams shows "bot is typing..." but no response
- Bot appears offline

**Diagnosis:**
```bash
# Check bot credentials
echo $BOT_ID
echo $BOT_PASSWORD

# Test bot endpoint
curl -X POST http://localhost:3978/api/messages \
  -H "Content-Type: application/json" \
  -d '{"type":"message","text":"test"}'
```

**Solutions:**

1. **Invalid Bot Credentials**
   ```bash
   # Verify in Azure Portal
   # Go to Azure Bot Service > Configuration
   # Check App ID and Password
   
   # Update .env file
   BOT_ID=correct-app-id
   BOT_PASSWORD=correct-password
   ```

2. **Teams App Not Registered**
   - Go to https://dev.teams.microsoft.com/apps
   - Verify bot is properly configured
   - Check bot permissions

3. **Network/Firewall Issues**
   ```bash
   # Test external connectivity
   curl -I https://your-domain.com/api/health
   
   # Check if port is open
   netstat -tlnp | grep 3978
   ```

### WebSocket Connection Failed

**Symptoms:**
- Bot logs show "WebSocket connection failed"
- Audio not being processed
- Health check shows "websocket": "disconnected"

**Diagnosis:**
```bash
# Test WebSocket connection
node -e "
const WebSocket = require('ws');
const ws = new WebSocket('$WEBSOCKET_URL');
ws.on('open', () => console.log('Connected'));
ws.on('error', (e) => console.log('Error:', e.message));
"
```

**Solutions:**

1. **Incorrect WebSocket URL**
   ```bash
   # Verify URL format
   WEBSOCKET_URL=ws://your-server:port/websocket
   # or
   WEBSOCKET_URL=wss://your-server:port/websocket
   ```

2. **On-Prem Server Not Running**
   ```bash
   # Check if your websocket server is running
   # Verify the service is started
   # Check server logs
   ```

3. **Network Connectivity**
   ```bash
   # Test network connectivity
   telnet your-server port
   
   # Check firewall rules
   sudo ufw status
   ```

4. **SSL/TLS Issues (for WSS)**
   ```bash
   # Test SSL connection
   openssl s_client -connect your-server:port
   
   # Check certificate validity
   openssl x509 -in cert.pem -text -noout
   ```

### Audio Processing Issues

**Symptoms:**
- Audio not being sent to on-prem system
- No audio response from TTS
- Audio quality issues

**Diagnosis:**
```bash
# Check audio bridge logs
grep "audio" logs/combined.log

# Monitor audio processing
tail -f logs/combined.log | grep -E "(audio|Audio)"
```

**Solutions:**

1. **Audio Format Mismatch**
   ```javascript
   // Check audio configuration in .env
   AUDIO_SAMPLE_RATE=16000
   AUDIO_CHANNELS=1
   AUDIO_BIT_DEPTH=16
   ```

2. **NIM Services Not Running**
   - Verify ASR NIM is running
   - Verify TTS NIM is running
   - Check NIM service logs

3. **Audio Bridge Configuration**
   ```javascript
   // In audioBridge.js, verify audio conversion
   async convertAudioFormat(audioData) {
     // Implement proper conversion for your format
     return audioData;
   }
   ```

### Teams Integration Issues

**Symptoms:**
- Bot can't join calls
- Audio not captured from Teams
- Bot permissions denied

**Diagnosis:**
```bash
# Check Teams app manifest
# Verify bot permissions in Teams
# Test bot in Teams client
```

**Solutions:**

1. **Missing Teams Permissions**
   ```json
   // In manifest.json, ensure these permissions:
   "permissions": [
     "Calls.InitiateOutgoingCall",
     "Calls.JoinGroupCall", 
     "Calls.AccessMedia",
     "Calls.InitiateGroupCall"
   ]
   ```

2. **Bot Not Added to Teams**
   - Add bot to Teams chat/channel
   - Verify bot is available in Teams
   - Check bot status in Teams

3. **Teams App Not Published**
   - Publish app to your organization
   - Wait for admin approval
   - Verify app is available

### Performance Issues

**Symptoms:**
- High latency in audio processing
- Bot responses are slow
- Memory/CPU usage high

**Diagnosis:**
```bash
# Monitor system resources
top -p $(pgrep node)

# Check memory usage
ps aux | grep node

# Monitor network usage
iftop -i eth0
```

**Solutions:**

1. **Resource Constraints**
   ```bash
   # Increase Node.js memory limit
   node --max-old-space-size=4096 src/index.js
   
   # Or in production
   NODE_OPTIONS="--max-old-space-size=4096" npm start
   ```

2. **Network Latency**
   - Optimize network path to on-prem server
   - Use CDN for static assets
   - Implement connection pooling

3. **Audio Processing Optimization**
   ```javascript
   // Implement audio buffering
   // Use streaming audio processing
   // Optimize audio format conversion
   ```

## Debug Mode

### Enable Debug Logging

```bash
# Set debug level
export LOG_LEVEL=debug

# Start bot with debug
LOG_LEVEL=debug npm start
```

### Debug WebSocket

```javascript
// Add to websocketClient.js
this.ws.on('message', (data) => {
  console.log('Raw WebSocket data:', data);
  // ... rest of handler
});
```

### Debug Audio Bridge

```javascript
// Add to audioBridge.js
async processTeamsAudio(callId, audioData) {
  console.log('Processing audio:', {
    callId,
    dataLength: audioData.length,
    timestamp: new Date().toISOString()
  });
  // ... rest of processing
}
```

## Log Analysis

### Common Log Patterns

```bash
# Find all errors
grep "ERROR" logs/combined.log

# Find WebSocket issues
grep -i "websocket" logs/combined.log

# Find audio processing
grep -i "audio" logs/combined.log

# Find Teams events
grep -i "teams" logs/combined.log
```

### Log Rotation

```bash
# Check log file sizes
ls -lh logs/

# Rotate logs if needed
mv logs/combined.log logs/combined.log.old
mv logs/error.log logs/error.log.old
```

## Network Troubleshooting

### Connectivity Tests

```bash
# Test DNS resolution
nslookup your-domain.com

# Test HTTP connectivity
curl -I https://your-domain.com

# Test WebSocket connectivity
wscat -c ws://your-websocket-server:port

# Test Teams connectivity
curl -I https://api.teams.microsoft.com
```

### Firewall Configuration

```bash
# Check firewall status
sudo ufw status

# Allow required ports
sudo ufw allow 3978
sudo ufw allow 443
sudo ufw allow 80

# Check iptables
sudo iptables -L
```

## SSL/TLS Issues

### Certificate Problems

```bash
# Check certificate validity
openssl x509 -in cert.pem -text -noout

# Test SSL connection
openssl s_client -connect your-domain.com:443

# Check certificate chain
openssl verify cert.pem
```

### SSL Configuration

```nginx
# Nginx SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
ssl_prefer_server_ciphers off;
```

## Recovery Procedures

### Bot Service Recovery

```bash
# Restart bot service
sudo systemctl restart teams-bot

# Check service status
sudo systemctl status teams-bot

# View service logs
sudo journalctl -u teams-bot -f
```

### WebSocket Recovery

```bash
# Restart WebSocket client
# The client should auto-reconnect, but you can force restart:
curl -X POST http://localhost:3978/api/restart-websocket
```

### Full System Recovery

```bash
# Stop all services
sudo systemctl stop teams-bot

# Clear temporary files
rm -rf /tmp/teams-bot-*

# Restart services
sudo systemctl start teams-bot

# Verify recovery
curl http://localhost:3978/api/health
```

## Getting Help

### Information to Collect

When seeking help, collect:

1. **Environment Information**
   ```bash
   node --version
   npm --version
   uname -a
   cat /etc/os-release
   ```

2. **Configuration**
   ```bash
   # (Remove sensitive data)
   cat .env | grep -v PASSWORD
   ```

3. **Logs**
   ```bash
   tail -n 100 logs/combined.log
   tail -n 50 logs/error.log
   ```

4. **Health Check**
   ```bash
   curl http://localhost:3978/api/health
   ```

### Support Channels

- Check this troubleshooting guide first
- Review Microsoft Teams Bot documentation
- Check your on-prem system documentation
- Contact your system administrator
- Review application logs for specific errors

## Prevention

### Monitoring Setup

```bash
# Set up log monitoring
tail -f logs/combined.log | grep -E "(ERROR|WARN)"

# Set up health check monitoring
watch -n 30 'curl -s http://localhost:3978/api/health'

# Set up system monitoring
htop
```

### Regular Maintenance

```bash
# Weekly log rotation
logrotate /etc/logrotate.d/teams-bot

# Monthly certificate check
openssl x509 -in cert.pem -checkend 2592000

# Quarterly dependency updates
npm audit
npm update
``` 
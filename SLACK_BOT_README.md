# SlackMeNot Bot

A powerful Slack bot built with the [Slack Bolt Framework](https://slack.dev/bolt-js/) for reliable and scalable bot development.

## Features

- 🤖 **Core Slack Bot Infrastructure** - Built with Slack Bolt Framework
- 📝 **Event Handling** - Handles app mentions, messages, reactions, and team joins
- ⚡ **Slash Commands** - Custom commands for bot interaction
- 🔐 **Authentication & Security** - Middleware for request validation
- 📊 **Logging & Monitoring** - Structured logging with Winston
- 🛠️ **Development Ready** - Hot reloading, environment configuration, and debugging tools

## Quick Start

### Prerequisites

- Node.js 18+ 
- A Slack workspace with admin permissions
- Slack App credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd slackmenot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp config.env.example .env.local
   ```
   
   Edit `.env.local` with your Slack app credentials:
   ```env
   SLACK_BOT_TOKEN=xoxb-your-bot-token-here
   SLACK_SIGNING_SECRET=your-signing-secret-here
   SLACK_APP_TOKEN=xapp-your-app-token-here
   ```

4. **Start the bot**
   ```bash
   # Development mode with hot reload
   npm run dev
   
   # Production mode
   npm start
   ```

## Slack App Setup

### 1. Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Name your app "SlackMeNot" and select your workspace

### 2. Configure OAuth & Permissions

Navigate to **OAuth & Permissions** and add these scopes:

**Bot Token Scopes:**
- `app_mentions:read` - Read mentions of your app
- `channels:history` - View messages in public channels
- `channels:read` - View basic information about public channels
- `chat:write` - Send messages as your app
- `commands` - Add slash commands
- `groups:history` - View messages in private channels
- `groups:read` - View basic information about private channels
- `im:history` - View messages in DMs
- `im:read` - View basic information about DMs
- `mpim:history` - View messages in group DMs
- `mpim:read` - View basic information about group DMs
- `reactions:read` - View emoji reactions and their associated content
- `team:read` - View basic information about the workspace
- `users:read` - View basic information about users

### 3. Configure Event Subscriptions

Navigate to **Event Subscriptions** and enable events:

**Bot Events:**
- `app_mention` - Your app was mentioned in a channel
- `message.channels` - A message was posted to a public channel
- `message.groups` - A message was posted to a private channel
- `message.im` - A message was posted in a DM
- `message.mpim` - A message was posted in a group DM
- `reaction_added` - An emoji reaction was added to a message
- `team_join` - A new member joined the workspace

### 4. Create Slash Commands

Navigate to **Slash Commands** and create:

**Command 1:**
- Command: `/slackmenot`
- Request URL: `https://your-domain.com/slack/events`
- Short Description: "Interact with SlackMeNot bot"
- Usage Hint: "help, status, info, ping, version"

**Command 2:**
- Command: `/ping`
- Request URL: `https://your-domain.com/slack/events`
- Short Description: "Test bot connectivity"
- Usage Hint: ""

### 5. Install App to Workspace

1. Go to **Install App** in the sidebar
2. Click "Install to Workspace"
3. Copy the **Bot User OAuth Token** (starts with `xoxb-`)
4. Copy the **Signing Secret** from **Basic Information**

### 6. Enable Socket Mode (for development)

1. Go to **Basic Information**
2. Under **App-Level Tokens**, create a new token
3. Name it "slackmenot-socket-token"
4. Add the `connections:write` scope
5. Copy the token (starts with `xapp-`)

## Project Structure

```
slackmenot/
├── src/
│   ├── app.js                 # Main application entry point
│   ├── handlers/
│   │   ├── commands.js        # Slash command handlers
│   │   └── events.js          # Event handlers
│   ├── middleware/
│   │   └── index.js           # Middleware setup
│   └── utils/
│       ├── helpers.js         # Utility functions
│       └── logger.js          # Logging configuration
├── logs/                      # Log files (created automatically)
├── config.env.example         # Environment variables template
├── package.json               # Dependencies and scripts
└── README.md                  # This file
```

## Available Commands

### Slash Commands

- `/slackmenot help` - Show help message
- `/slackmenot status` - Check bot status and health
- `/slackmenot info` - Get bot information
- `/slackmenot ping` - Test bot connectivity
- `/slackmenot version` - Get bot version
- `/slackmenot debug` - Debug information (development only)
- `/ping` - Simple ping test

### App Mentions

Mention the bot in any channel with:
- `@SlackMeNot help` - Show help
- `@SlackMeNot status` - Check status
- `@SlackMeNot info` - Get information

## Development

### Scripts

```bash
npm start          # Start the bot
npm run dev        # Start with hot reload
npm test           # Run tests
npm run lint       # Lint code
npm run lint:fix   # Fix linting issues
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SLACK_BOT_TOKEN` | Bot User OAuth Token | Yes |
| `SLACK_SIGNING_SECRET` | App Signing Secret | Yes |
| `SLACK_APP_TOKEN` | App-Level Token for Socket Mode | Yes |
| `BOT_NAME` | Bot display name | No |
| `BOT_EMOJI` | Bot emoji icon | No |
| `NODE_ENV` | Environment (development/production) | No |
| `PORT` | Server port | No |
| `LOG_LEVEL` | Logging level | No |

### Logging

The bot uses Winston for structured logging. Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- Console (in development)

### Adding New Features

1. **New Commands**: Add handlers in `src/handlers/commands.js`
2. **New Events**: Add handlers in `src/handlers/events.js`
3. **New Middleware**: Add to `src/middleware/index.js`
4. **New Utilities**: Add to `src/utils/helpers.js`

## Deployment

### Local Development

```bash
npm install
cp config.env.example .env.local
# Edit .env.local with your credentials
npm run dev
```

### Production Deployment

1. Set up your production environment
2. Configure environment variables
3. Install dependencies: `npm install --production`
4. Start the bot: `npm start`

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Troubleshooting

### Common Issues

1. **"Invalid token" error**
   - Verify your `SLACK_BOT_TOKEN` is correct
   - Ensure the token starts with `xoxb-`

2. **"Invalid signing secret" error**
   - Check your `SLACK_SIGNING_SECRET` in the Slack app settings

3. **Bot not responding to mentions**
   - Verify `app_mention` event is subscribed
   - Check bot permissions include `app_mentions:read`

4. **Commands not working**
   - Ensure slash commands are properly configured
   - Check bot has `commands` scope

### Debug Mode

Enable debug logging by setting:
```env
LOG_LEVEL=debug
NODE_ENV=development
```

Then use `/slackmenot debug` to get detailed information.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Check the [Slack Bolt Framework documentation](https://slack.dev/bolt-js/)
- Review the [Slack API documentation](https://api.slack.com/)
- Open an issue in this repository 
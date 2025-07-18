const { App } = require('@slack/bolt');
const dotenv = require('dotenv');
const logger = require('./utils/logger');
const { setupEventHandlers } = require('./handlers/events');
const { setupCommandHandlers } = require('./handlers/commands');
const { setupMiddleware } = require('./middleware');

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize the Slack app
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  logLevel: process.env.LOG_LEVEL || 'info',
});

// Setup middleware
setupMiddleware(app);

// Setup event handlers
setupEventHandlers(app);

// Setup command handlers
setupCommandHandlers(app);

// Health check endpoint (only if using HTTP mode)
if (app.receiver && app.receiver.router) {
  app.receiver.router.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    });
  });
}

// Error handling
app.error((error) => {
  logger.error('Slack app error:', error);
});

// Start the app
(async () => {
  try {
    await app.start(process.env.PORT || 3000);
    logger.info(`⚡️ SlackMeNot bot is running on port ${process.env.PORT || 3000}`);
  } catch (error) {
    logger.error('Error starting the app:', error);
    process.exit(1);
  }
})();

module.exports = app; 
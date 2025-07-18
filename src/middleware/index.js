const logger = require('../utils/logger');

/**
 * Setup middleware for the Slack app
 * @param {App} app - The Slack Bolt app instance
 */
function setupMiddleware(app) {
    // Logging middleware
    app.use(async (args) => {
        const { logger: boltLogger, context, next } = args;

        // Log incoming requests
        logger.info('Incoming request', {
            type: context.type,
            userId: context.userId,
            channelId: context.channelId,
            teamId: context.teamId,
        });

        // Add custom logger to context
        context.customLogger = logger;

        await next();
    });

    // Authentication middleware
    app.use(async (args) => {
        const { context, next } = args;

        // Verify the request is from Slack
        if (!context.teamId) {
            logger.warn('Request without team ID, skipping authentication');
            return;
        }

        // Add authentication info to context
        context.isAuthenticated = true;
        context.authInfo = {
            teamId: context.teamId,
            userId: context.userId,
            channelId: context.channelId,
        };

        await next();
    });

    // Error handling middleware
    app.use(async (args) => {
        const { next } = args;

        try {
            await next();
        } catch (error) {
            logger.error('Middleware error:', error);
            throw error;
        }
    });
}

module.exports = {
    setupMiddleware,
}; 
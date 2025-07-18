const logger = require('../utils/logger');

/**
 * Setup event handlers for the Slack app
 * @param {App} app - The Slack Bolt app instance
 */
function setupEventHandlers(app) {
    // Handle app mention events
    app.event('app_mention', async ({ event, say, context }) => {
        try {
            logger.info('App mention received', {
                userId: event.user,
                channel: event.channel,
                text: event.text
            });

            // Extract the message text without the bot mention
            const messageText = event.text.replace(/<@[^>]+>/, '').trim();

            if (!messageText) {
                await say({
                    text: `Hello <@${event.user}>! I'm your SlackMeNot bot. How can I help you today?`,
                    thread_ts: event.ts
                });
                return;
            }

            // Handle different types of mentions
            await handleAppMention(messageText, event, say, context);
        } catch (error) {
            logger.error('Error handling app mention:', error);
            await say({
                text: 'Sorry, I encountered an error processing your request.',
                thread_ts: event.ts
            });
        }
    });

    // Handle message events
    app.event('message', async ({ event, context }) => {
        try {
            // Skip bot messages and messages without text
            if (event.bot_id || !event.text) {
                return;
            }

            logger.info('Message received', {
                userId: event.user,
                channel: event.channel,
                text: event.text.substring(0, 100) // Log first 100 chars
            });

            // Handle different types of messages
            await handleMessage(event, context);
        } catch (error) {
            logger.error('Error handling message:', error);
        }
    });

    // Handle reaction events
    app.event('reaction_added', async ({ event, context }) => {
        try {
            logger.info('Reaction added', {
                userId: event.user,
                item: event.item,
                reaction: event.reaction
            });

            await handleReaction(event, context);
        } catch (error) {
            logger.error('Error handling reaction:', error);
        }
    });

    // Handle team join events
    app.event('team_join', async ({ event, context }) => {
        try {
            logger.info('New team member joined', {
                userId: event.user.id,
                teamId: context.teamId
            });

            await handleTeamJoin(event, context);
        } catch (error) {
            logger.error('Error handling team join:', error);
        }
    });
}

/**
 * Handle app mention events
 */
async function handleAppMention(messageText, event, say, context) {
    const lowerMessage = messageText.toLowerCase();

    if (lowerMessage.includes('help') || lowerMessage.includes('commands')) {
        await say({
            text: `Here are some things I can help you with:

• \`/slackmenot help\` - Show this help message
• \`/slackmenot status\` - Check bot status
• \`/slackmenot info\` - Get bot information

You can also mention me with questions or requests!`,
            thread_ts: event.ts
        });
    } else if (lowerMessage.includes('status') || lowerMessage.includes('health')) {
        await say({
            text: `✅ Bot Status: Online and healthy!
• Environment: ${process.env.NODE_ENV || 'development'}
• Uptime: ${process.uptime().toFixed(2)} seconds
• Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
            thread_ts: event.ts
        });
    } else if (lowerMessage.includes('info') || lowerMessage.includes('about')) {
        await say({
            text: `🤖 *SlackMeNot Bot*
• Version: 1.0.0
• Built with: Slack Bolt Framework
• Environment: ${process.env.NODE_ENV || 'development'}
• Team: ${context.teamId}`,
            thread_ts: event.ts
        });
    } else {
        await say({
            text: `I heard you say: "${messageText}"
I'm still learning! Try mentioning me with "help" to see what I can do.`,
            thread_ts: event.ts
        });
    }
}

/**
 * Handle regular message events
 */
async function handleMessage(event, context) {
    // Add your custom message handling logic here
    // For example, keyword detection, sentiment analysis, etc.

    const messageText = event.text.toLowerCase();

    // Example: Detect certain keywords
    if (messageText.includes('urgent') || messageText.includes('emergency')) {
        logger.info('Urgent message detected', {
            userId: event.user,
            channel: event.channel
        });
        // You could add logic here to notify specific channels or users
    }
}

/**
 * Handle reaction events
 */
async function handleReaction(event, context) {
    // Add your custom reaction handling logic here
    // For example, tracking popular reactions, triggering workflows, etc.

    logger.info('Reaction handled', {
        reaction: event.reaction,
        userId: event.user,
        itemType: event.item.type
    });
}

/**
 * Handle team join events
 */
async function handleTeamJoin(event, context) {
    try {
        // Welcome new team members
        const welcomeMessage = `Welcome to the team, <@${event.user.id}>! 👋
I'm your SlackMeNot bot. Mention me with "help" to see what I can do.`;

        // You could send this to a specific channel or DM the user
        logger.info('New team member welcomed', {
            userId: event.user.id
        });
    } catch (error) {
        logger.error('Error welcoming new team member:', error);
    }
}

module.exports = {
    setupEventHandlers,
}; 
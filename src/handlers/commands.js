const logger = require('../utils/logger');

/**
 * Setup command handlers for the Slack app
 * @param {App} app - The Slack Bolt app instance
 */
function setupCommandHandlers(app) {
  // Handle /slackmenot command
  app.command('/slackmenot', async ({ command, ack, respond, context }) => {
    try {
      // Acknowledge the command request
      await ack();

      logger.info('Slash command received', {
        command: command.command,
        text: command.text,
        userId: command.user_id,
        channelId: command.channel_id,
        teamId: command.team_id
      });

      const commandText = command.text.toLowerCase().trim();

      if (!commandText || commandText === 'help') {
        await respond({
          text: `🤖 *SlackMeNot Bot Commands*
          
Here are the available commands:

• \`/slackmenot help\` - Show this help message
• \`/slackmenot status\` - Check bot status and health
• \`/slackmenot info\` - Get bot information
• \`/slackmenot ping\` - Test bot connectivity
• \`/slackmenot version\` - Get bot version

You can also mention me (@SlackMeNot) in any channel for interactive help!`,
          response_type: 'ephemeral'
        });
        return;
      }

      // Handle different command types
      await handleSlackMeNotCommand(commandText, command, respond, context);
    } catch (error) {
      logger.error('Error handling slash command:', error);
      await respond({
        text: 'Sorry, I encountered an error processing your command.',
        response_type: 'ephemeral'
      });
    }
  });

  // Handle /ping command (simple test command)
  app.command('/ping', async ({ command, ack, respond }) => {
    try {
      await ack();

      logger.info('Ping command received', {
        userId: command.user_id,
        channelId: command.channel_id
      });

      await respond({
        text: '🏓 Pong! Bot is alive and responding.',
        response_type: 'ephemeral'
      });
    } catch (error) {
      logger.error('Error handling ping command:', error);
      await respond({
        text: 'Error processing ping command.',
        response_type: 'ephemeral'
      });
    }
  });
}

/**
 * Handle slackmenot command with different subcommands
 */
async function handleSlackMeNotCommand(commandText, command, respond, context) {
  const args = commandText.split(' ');
  const subcommand = args[0];

  switch (subcommand) {
  case 'status':
  case 'health':
    await respond({
      text: `✅ *Bot Status Report*
        
• Status: Online and healthy
• Environment: ${process.env.NODE_ENV || 'development'}
• Uptime: ${process.uptime().toFixed(2)} seconds
• Memory Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
• Node Version: ${process.version}
• Team ID: ${context.teamId}
• User ID: ${command.user_id}`,
      response_type: 'ephemeral'
    });
    break;

  case 'info':
  case 'about':
    await respond({
      text: `🤖 *SlackMeNot Bot Information*
        
• Name: SlackMeNot
• Version: 1.0.0
• Framework: Slack Bolt Framework
• Environment: ${process.env.NODE_ENV || 'development'}
• Team: ${context.teamId}
• Channel: ${command.channel_id}
• User: <@${command.user_id}>

Built with ❤️ using the Slack Bolt Framework for reliable bot development.`,
      response_type: 'ephemeral'
    });
    break;

  case 'ping':
    await respond({
      text: '🏓 Pong! Bot is alive and responding.',
      response_type: 'ephemeral'
    });
    break;

  case 'version':
    await respond({
      text: `📦 *Version Information*
        
• Bot Version: 1.0.0
• Node.js: ${process.version}
• Bolt Framework: 3.17.1
• Environment: ${process.env.NODE_ENV || 'development'}`,
      response_type: 'ephemeral'
    });
    break;

  case 'debug':
    // Only allow debug in development
    if (process.env.NODE_ENV === 'development') {
      await respond({
        text: `🔧 *Debug Information*
          
• Command: ${command.command}
• Text: ${command.text}
• User: ${command.user_id}
• Channel: ${command.channel_id}
• Team: ${command.team_id}
• Timestamp: ${command.trigger_id}
• Environment: ${process.env.NODE_ENV}
• Process ID: ${process.pid}`,
        response_type: 'ephemeral'
      });
    } else {
      await respond({
        text: 'Debug mode is only available in development environment.',
        response_type: 'ephemeral'
      });
    }
    break;

  default:
    await respond({
      text: `Unknown command: "${subcommand}"
        
Try \`/slackmenot help\` to see available commands.`,
      response_type: 'ephemeral'
    });
    break;
  }
}

module.exports = {
  setupCommandHandlers,
}; 
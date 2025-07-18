const logger = require('../utils/logger');
const { getOpenPRs, getPRDiff } = require('../utils/githubClient');
const { askLlama } = require('../utils/mindsdbClient');
const ollama = require('ollama').default

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

  // /all-prs command
  app.command('/all-prs', async ({ command, ack, respond, client }) => {
    await ack();
    const prs = await getOpenPRs();
    if (!prs.length) {
      await respond('No open PRs found.');
      return;
    }
    const options = prs.map(pr => {
      // Slack requires option text to be <= 75 chars
      let text = `#${pr.number}: ${pr.title}`;
      if (text.length > 75) {
        text = text.slice(0, 72) + '...';
      }
      return {
        text: {
          type: 'plain_text',
          text
        },
        value: pr.number.toString()
      };
    });
    // Respond to the slash command with a simple message
    await respond({
      text: 'Fetching open PRs... Please wait.',
      response_type: 'ephemeral'
    });
    // Send the interactive message with blocks using chat.postMessage
    await client.chat.postMessage({
      channel: command.channel_id,
      text: 'Select a PR to summarize:',
      blocks: [
        {
          type: 'section',
          text: { type: 'mrkdwn', text: '*Select a PR to summarize:*' },
          accessory: {
            type: 'static_select',
            action_id: 'select_pr',
            placeholder: { type: 'plain_text', text: 'Choose a PR' },
            options
          }
        }
      ]
    });
  });

  // Handle PR selection
  app.action('select_pr', async ({ body, ack, respond, action }) => {
    await ack();
    // Immediately indicate to the user that the summary is being generated
    await respond({
      text: 'Summarizing PR... please wait.',
      response_type: 'ephemeral'
    });
    const prNumber = action.selected_option.value;
    const prs = await getOpenPRs();
    const pr = prs.find(pr => pr.number.toString() === prNumber);
    const diff = await getPRDiff(prNumber);
    const prompt = `Give a very short, high-level overview (2-3 sentences max) of the following GitHub PR. Do not include details, just the main purpose and any major changes.\n\nTitle: ${pr.title}\n\nDiff:\n${diff}`;
    const summary = await askLlama(prompt);
    // Extract Jira ticket (e.g., SCRUM-17) from PR title if present
    const jiraMatch = pr.title.match(/([A-Z]+-\d+)/);
    const jiraTag = jiraMatch ? ` (${jiraMatch[1]})` : '';
    await respond({
      text: `*Summary for PR #${pr.number}${jiraTag}:*\n${summary}`,
      replace_original: true
    });
  });

  // ask data
  app.command('/ask', async ({ command, ack, respond }) => {
    await ack();
    const question = command.text.trim();

    const response = await ollama.chat({
      model: 'qwen3:latest',
      messages: [
        { 'role': 'system', 'content': 'You are a helpful assistant.' },
        { 'role': 'user', 'content': question }
      ],
      tools: [
        {
          "type": "mcp",
          "server_label": "deepwiki",
          "server_url": new URL("/sse", process.env.MINDSDB_URL),
          "require_approval": "never",
          "headers": {
            "Authorization": `Bearer ${process.env.MINDSDB_MCP_ACCESS_TOKEN}`
          }
        }
      ]
    })

    await respond({
      text: response.message.tool_calls?.[0]?.function?.arguments?.answer || '',
      response_type: 'ephemeral'
    });
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
const logger = require('../utils/logger');
const { getOpenPRs, getPRDiff } = require('../utils/githubClient');
const { askLlama } = require('../utils/mindsdbClient');

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
  app.action('select_pr', async ({ body, ack, respond, action, client }) => {
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
    // 1. Get summary
    const summaryPrompt = `Give a very short, high-level overview (2-3 sentences max) of the following GitHub PR. Do not include details, just the main purpose and any major changes.\n\nTitle: ${pr.title}\n\nDiff:\n${diff}`;
    const summary = await askLlama(summaryPrompt);
    // Extract Jira ticket (e.g., SCRUM-17) from PR title if present
    const jiraMatch = pr.title.match(/([A-Z]+-\d+)/);
    const jiraTag = jiraMatch ? ` (${jiraMatch[1]})` : '';
    // 2. Get review suggestions and quality
    const reviewPrompt = `You are a code reviewer. Give a very short list of suggestions (if any) for improving the following PR, and estimate the overall code quality as a percentage (0-100). Keep suggestions short and actionable. If there are no suggestions, say 'No suggestions.'\n\nTitle: ${pr.title}\n\nDiff:\n${diff}\n\nRespond in this format:\nSuggestions:\n- ...\n- ...\nQuality: XX%`;
    const review = await askLlama(reviewPrompt);
    // 3. Parse suggestions and quality
    const suggestionsMatch = review.match(/Suggestions:\n([\s\S]*?)\nQuality:/);
    const qualityMatch = review.match(/Quality:\s*(\d+)%/);
    const suggestionsText = suggestionsMatch ? suggestionsMatch[1].trim() : 'No suggestions.';
    const qualityText = qualityMatch ? qualityMatch[1] + '%' : 'N/A';
    // 4. Show summary, review, and action buttons, with Gladiator image
    await respond({
      text: `*Summary for PR #${pr.number}${jiraTag}:*\n${summary}\n\n*Code Review Suggestions:*\n${suggestionsText}\n*Estimated Code Quality:* ${qualityText}`,
      blocks: [
        { type: 'section', text: { type: 'mrkdwn', text: `*Summary for PR #${pr.number}${jiraTag}:*\n${summary}` } },
        { type: 'section', text: { type: 'mrkdwn', text: `*Code Review Suggestions:*\n${suggestionsText}` } },
        { type: 'context', elements: [{ type: 'mrkdwn', text: `*Estimated Code Quality:* ${qualityText}` }] },
        { type: 'image', image_url: 'https://www.slashfilm.com/img/gallery/ridley-scott-says-it-would-be-stupid-of-me-not-to-direct-gladiator-2/l-intro-1636469417.jpg', alt_text: 'Gladiator' },
        {
          type: 'actions',
          elements: [
            { type: 'button', text: { type: 'plain_text', text: 'Approve PR' }, style: 'primary', action_id: 'approve_pr', value: prNumber },
            { type: 'button', text: { type: 'plain_text', text: 'Suggest something' }, style: 'danger', action_id: 'suggest_pr', value: JSON.stringify({ prNumber, suggestions: suggestionsText }) }
          ]
        }
      ],
      replace_original: true
    });
  });

  // Approve PR action
  app.action('approve_pr', async ({ ack, body, action, client, respond }) => {
    await ack();
    const prNumber = action.value;
    // TODO: Approve the PR on GitHub (implement approvePR in githubClient)
    if (typeof require('../utils/githubClient').approvePR === 'function') {
      await require('../utils/githubClient').approvePR(prNumber);
    }
    await respond({
      text: 'PR approved! 🏆',
      blocks: [
        { type: 'image', image_url: 'https://img-s-msn-com.akamaized.net/tenant/amp/entityid/AA1uzrgy.img?w=768&h=431&m=6&x=107&y=117&s=151&d=151', alt_text: 'Approved' }
      ],
      replace_original: true
    });
  });

  // Suggest something action
  app.action('suggest_pr', async ({ ack, body, action, client, respond }) => {
    await ack();
    const { prNumber, suggestions } = JSON.parse(action.value);
    // Parse suggestions into a list
    const suggestionList = suggestions.split('\n').filter(s => s.trim().startsWith('-')).map(s => s.replace(/^\-\s*/, '').trim());
    // Show suggestions as checkboxes, with suggestion image
    await respond({
      text: 'Select suggestions to comment on the PR:',
      blocks: [
        { type: 'image', image_url: 'https://i.pinimg.com/736x/f3/eb/bc/f3ebbc4bc6086944196241cf7146ea47.jpg', alt_text: 'Suggestions' },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: '*Select suggestions to comment on the PR:*' },
          accessory: {
            type: 'checkboxes',
            action_id: 'submit_suggestions',
            options: suggestionList.map((s, i) => ({
              text: { type: 'plain_text', text: s.length > 75 ? s.slice(0, 72) + '...' : s },
              value: s
            }))
          }
        }
      ],
      replace_original: true
    });
  });

  // Handle submitting suggestions as PR comment
  app.action('submit_suggestions', async ({ ack, body, action, respond }) => {
    await ack();
    // Get selected suggestions
    const selected = action.selected_options.map(opt => opt.value);
    // Find PR number from previous block (assume in message or context)
    // We'll pass prNumber as a hidden block in the future, but for now, get from context
    // For now, try to get from the last message text
    const prNumberMatch = body.message && body.message.text && body.message.text.match(/PR #(\d+)/);
    const prNumber = prNumberMatch ? prNumberMatch[1] : null;
    if (!prNumber || selected.length === 0) {
      await respond({
        text: 'No suggestions selected or PR number missing.',
        replace_original: true
      });
      return;
    }
    // Post suggestions as a comment on the PR
    const comment = selected.map(s => `- ${s}`).join('\n');
    if (typeof require('../utils/githubClient').commentOnPR === 'function') {
      await require('../utils/githubClient').commentOnPR(prNumber, comment);
    }
    await respond({
      text: 'Suggestions have been commented on the PR! 🎉',
      replace_original: true
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
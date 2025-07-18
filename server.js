const express = require('express');
const { createEventAdapter } = require('@slack/events-api');
const { WebClient } = require('@slack/web-api');
require('dotenv').config({ path: '.env.local' });

const app = express();
const port = process.env.PORT || 3000;

// Slack configuration
const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;
const slackEvents = createEventAdapter(slackSigningSecret);
const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);

// Middleware
app.use(express.json());
app.use('/slack/events', slackEvents.expressMiddleware());

// Handle app_mention events
slackEvents.on('app_mention', async (event) => {
    console.log('Received app_mention event:', event);

    // Remove the bot mention from the text
    const text = event.text.replace(/<@[^>]+>\s*/, '').trim();
    let reply = "I'm not sure how to help with that.";

    // Check if it's an "ask" command
    if (text.toLowerCase().startsWith('ask')) {
        const question = text.replace(/^ask\s*/i, '').trim();
        if (question) {
            reply = `You asked: "${question}". I'll process this with MindsDB soon!`;
            console.log('Question received:', question);
        } else {
            reply = "Please provide a question after 'ask'.";
        }
    } else if (text.toLowerCase().startsWith('hello') || text.toLowerCase().startsWith('hi')) {
        reply = "Hello! I'm your Slack bot. Try mentioning me with 'ask' followed by a question!";
    }

    try {
        // Post the reply back to Slack
        await slackClient.chat.postMessage({
            channel: event.channel,
            text: reply,
            thread_ts: event.ts, // Reply in thread
        });
        console.log('Message posted successfully');
    } catch (error) {
        console.error('Error posting message:', error);
    }
});

// Test Slack connection endpoint
// Replace 'YOUR_CHANNEL_ID' with a real channel ID from your Slack workspace.
app.get('/test-slack', async (req, res) => {
    try {
        const result = await slackClient.chat.postMessage({
            channel: 'C0966RB2JN7', // <-- Replace this with your channel ID
            text: 'Test message from server!',
        });
        res.json({ ok: true, result });
    } catch (error) {
        console.error('Slack API error:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
});

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Slack bot server is running',
        timestamp: new Date().toISOString()
    });
});

// Start the server
app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📡 Slack events endpoint: http://localhost:${port}/slack/events`);
}); 
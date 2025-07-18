const { App, ExpressReceiver } = require('@slack/bolt');
const { queryMindsDB, testConnection } = require('./mindsdbClient');
require('dotenv').config({ path: '.env.local' });

// Log environment variables for debugging
console.log('SLACK_BOT_TOKEN:', process.env.SLACK_BOT_TOKEN ? '[SET]' : '[NOT SET]');
console.log('SLACK_SIGNING_SECRET:', process.env.SLACK_SIGNING_SECRET ? '[SET]' : '[NOT SET]');
console.log('PORT:', process.env.PORT);

// Create ExpressReceiver to handle raw requests
const receiver = new ExpressReceiver({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    endpoints: '/slack/events',
});

// Handle Slack's URL verification challenge
receiver.router.post('/slack/events', (req, res, next) => {
    if (req.body && req.body.type === 'url_verification' && req.body.challenge) {
        console.log('🔍 Received Slack challenge request:', req.body.challenge);
        res.status(200).send(req.body.challenge);
        return;
    }
    next();
});

// Health check endpoint
receiver.router.get('/', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Slack bot server is running',
        timestamp: new Date().toISOString()
    });
});

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    receiver,
});

app.command('/events', async ({ command, ack, say }) => {
    console.log('Received /events command:', command);
    await ack();
    await say(`👋 Hello from your bot! This is the /events command working!`);
});

// Handle app_mention events with MindsDB integration
app.event('app_mention', async ({ event, say }) => {
    console.log('🎯 Received app_mention event:', event);
    console.log('📝 Event text:', event.text);

    // Remove the bot mention from the text
    const text = event.text.replace(/<@[^>]+>\s*/, '').trim();
    console.log('📝 Parsed text after removing mention:', text);
    console.log('🔍 Text starts with "ask"?', text.toLowerCase().startsWith('ask'));

    let reply = "I'm not sure how to help with that.";

    // Check if it's an "ask" command
    if (text.toLowerCase().startsWith('ask')) {
        const question = text.replace(/^ask\s*/i, '').trim();
        console.log('❓ Extracted question:', question);

        if (question) {
            console.log('Question received:', question);

            // Get AI response from MindsDB
            try {
                console.log('🤖 Calling AI for response...');
                reply = await queryMindsDB(question);
                console.log('✅ AI response received:', reply);
            } catch (error) {
                console.error('Error querying AI:', error);
                reply = `Sorry, I'm having trouble connecting to my AI brain right now. Please try again later.`;
            }
        } else {
            reply = "Please provide a question after 'ask'.";
        }
    } else if (text.toLowerCase().startsWith('hello') || text.toLowerCase().startsWith('hi')) {
        reply = "Hello! I'm your AI-powered Slack bot. Try mentioning me with 'ask' followed by a question!";
    } else if (text.toLowerCase().includes('test mindsdb') || text.toLowerCase().includes('test ai')) {
        // Test MindsDB connection
        const isConnected = await testConnection();
        reply = isConnected
            ? "✅ AI connection is working! I'm ready to answer your questions."
            : "❌ AI connection failed. Please check your setup.";
    } else {
        console.log('❌ No matching command found for text:', text);
    }

    console.log('💬 Sending reply:', reply);
    await say({
        text: reply,
        thread_ts: event.ts // Reply in thread
    });
    console.log('✅ Reply sent successfully');
});

// Error handling
app.error((error) => {
    console.error('Slack app error:', error);
});

(async () => {
    await app.start(process.env.PORT || 3000);
    console.log(`⚡️ Slack bot is running on http://localhost:${process.env.PORT || 3000}`);

    // Test MindsDB connection on startup
    console.log('🔍 Testing AI connection...');
    await testConnection();
})();
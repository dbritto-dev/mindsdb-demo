const logger = require('./logger');

/**
 * Format a timestamp for display
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatted timestamp
 */
function formatTimestamp(timestamp) {
    return new Date(timestamp * 1000).toLocaleString();
}

/**
 * Extract user mentions from text
 * @param {string} text - Text to parse
 * @returns {Array} Array of user IDs
 */
function extractUserMentions(text) {
    const mentionRegex = /<@([A-Z0-9]+)>/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
        mentions.push(match[1]);
    }

    return mentions;
}

/**
 * Extract channel mentions from text
 * @param {string} text - Text to parse
 * @returns {Array} Array of channel IDs
 */
function extractChannelMentions(text) {
    const channelRegex = /<#([A-Z0-9]+)\|([^>]+)>/g;
    const channels = [];
    let match;

    while ((match = channelRegex.exec(text)) !== null) {
        channels.push({
            id: match[1],
            name: match[2]
        });
    }

    return channels;
}

/**
 * Sanitize text for logging (remove sensitive info)
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
function sanitizeText(text) {
    if (!text) return '';

    // Remove potential tokens or sensitive data
    return text
        .replace(/xoxb-[a-zA-Z0-9-]+/g, '[BOT_TOKEN]')
        .replace(/xoxp-[a-zA-Z0-9-]+/g, '[USER_TOKEN]')
        .replace(/xoxa-[a-zA-Z0-9-]+/g, '[APP_TOKEN]')
        .substring(0, 200); // Limit length
}

/**
 * Validate environment variables
 * @returns {Object} Validation result
 */
function validateEnvironment() {
    const required = [
        'SLACK_BOT_TOKEN',
        'SLACK_SIGNING_SECRET',
        'SLACK_APP_TOKEN'
    ];

    const missing = [];
    const present = {};

    for (const varName of required) {
        if (!process.env[varName]) {
            missing.push(varName);
        } else {
            present[varName] = process.env[varName].substring(0, 10) + '...';
        }
    }

    return {
        isValid: missing.length === 0,
        missing,
        present
    };
}

/**
 * Get bot information
 * @returns {Object} Bot info
 */
function getBotInfo() {
    return {
        name: process.env.BOT_NAME || 'SlackMeNot',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        pid: process.pid
    };
}

/**
 * Create a simple response object
 * @param {string} text - Response text
 * @param {Object} options - Additional options
 * @returns {Object} Formatted response
 */
function createResponse(text, options = {}) {
    return {
        text,
        response_type: options.response_type || 'in_channel',
        ...options
    };
}

/**
 * Log bot activity
 * @param {string} action - Action being performed
 * @param {Object} context - Context information
 */
function logActivity(action, context = {}) {
    logger.info('Bot activity', {
        action,
        timestamp: new Date().toISOString(),
        ...context
    });
}

module.exports = {
    formatTimestamp,
    extractUserMentions,
    extractChannelMentions,
    sanitizeText,
    validateEnvironment,
    getBotInfo,
    createResponse,
    logActivity
}; 
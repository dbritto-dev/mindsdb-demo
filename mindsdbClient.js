const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// MindsDB HTTP API configuration
const mindsdbConfig = {
    baseURL: process.env.MINDSDB_URL || 'http://localhost:47334',
    headers: {
        'Content-Type': 'application/json'
    }
};

const mindsdbClient = axios.create(mindsdbConfig);

// Ollama API configuration
const ollamaConfig = {
    baseURL: 'http://localhost:11434',
    headers: {
        'Content-Type': 'application/json'
    }
};

const ollamaClient = axios.create(ollamaConfig);

async function queryMindsDB(question) {
    try {
        console.log('🤖 Querying Ollama with question:', question);

        // Use Ollama directly for AI responses
        const response = await ollamaClient.post('/api/generate', {
            model: 'llama2:7b',
            prompt: `Answer this question briefly and concisely (max 2-3 sentences): ${question}`,
            stream: false
        });

        console.log('✅ Ollama response received');

        if (response.data && response.data.response) {
            return response.data.response;
        } else {
            return `I received your question: "${question}". Let me process this with my AI model...`;
        }
    } catch (error) {
        console.error('❌ Ollama query error:', error.message);
        return `I'm having trouble connecting to my AI brain right now. Error: ${error.message}`;
    }
}

// Test the connection
async function testConnection() {
    try {
        console.log('🔍 Testing Ollama connection...');
        const response = await ollamaClient.post('/api/generate', {
            model: 'llama2:7b',
            prompt: 'Say hello',
            stream: false
        });

        console.log('✅ Ollama connection test successful');
        console.log('Response:', response.data.response);
        return true;
    } catch (error) {
        console.error('❌ Ollama connection test failed:', error.message);
        return false;
    }
}

// Get available models
async function getAvailableModels() {
    try {
        const response = await ollamaClient.get('/api/tags');

        if (response.data && response.data.models) {
            console.log('Available Ollama models:', response.data.models);
            return response.data.models;
        }
        return [];
    } catch (error) {
        console.error('❌ Failed to get Ollama models:', error.message);
        return [];
    }
}

module.exports = {
    queryMindsDB,
    testConnection,
    getAvailableModels
};
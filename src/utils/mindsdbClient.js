const axios = require('axios');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

async function askLlama(question) {
  try {
    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: 'llama2', // Use the model name as in your working curl
      prompt: `Answer briefly: ${question}`,
      stream: false
    });
    return response.data.response || 'Sorry, I couldn\'t get an answer.';
  } catch (err) {
    console.error('Ollama/Llama error:', err.message);
    return 'Sorry, I couldn\'t connect to the AI.';
  }
}

module.exports = { askLlama }; 
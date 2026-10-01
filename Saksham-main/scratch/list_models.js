require('dotenv').config({ path: 'server/.env' });
const https = require('https');

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      const names = (data.models || []).map(m => m.name);
      console.log('Available models:', names);
    } catch (e) {
      console.error(e.message, body);
    }
  });
}).on('error', console.error);

require('dotenv').config({ path: 'server/.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const list = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.1-pro-preview'
];

async function check() {
  for (const m of list) {
    try {
      const model = genAI.getGenerativeModel({ model: m });
      const res = await model.generateContent('Say {"ok": true} in json');
      console.log(`MODEL ${m} -> SUCCESS! Output: ${res.response.text().trim()}`);
    } catch (e) {
      console.log(`MODEL ${m} -> FAILED: ${e.message.slice(0, 100)}`);
    }
  }
}

check();

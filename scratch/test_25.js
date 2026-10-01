require('dotenv').config({ path: 'server/.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testFast() {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const res = await model.generateContent('Say {"ok": true} in valid JSON');
  console.log('Result from gemini-2.5-flash:', res.response.text());
}

testFast().catch(console.error);

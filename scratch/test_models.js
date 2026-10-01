require('dotenv').config({ path: 'server/.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const candidateModels = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro',
  'gemini-3.5-flash'
];

async function check() {
  for (const m of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({ model: m });
      const res = await model.generateContent('Say {"ok": true} in json');
      console.log(`Model ${m}: SUCCESS ->`, res.response.text().trim());
      break;
    } catch (e) {
      console.log(`Model ${m}: FAILED ->`, e.message);
    }
  }
}

check();

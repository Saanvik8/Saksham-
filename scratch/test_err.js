require('dotenv').config({ path: 'server/.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testPrompt() {
  const prompt = `You are an expert interview evaluator. Evaluate this candidate's answer for an interview.

Question: Explain microservices
Answer: We use Kafka and gRPC
Interview Phase: Technical

Return ONLY valid JSON (no extra text, no markdown):
{
  "answerScore": 8.0,
  "category": "Strong",
  "missingConcepts": ["concept1"],
  "depthAnalysis": "Short depth analysis",
  "observation": "Short observation",
  "feedback": "Constructive feedback"
}`;

  const model = genAI.getGenerativeModel({ model: 'gemini-3.8-flash' });
  try {
    const res = await model.generateContent(prompt);
    console.log('Result raw:', res.response.text());
  } catch (e) {
    console.error('Error from 3.8 prompt:', e);
  }
}

testPrompt();

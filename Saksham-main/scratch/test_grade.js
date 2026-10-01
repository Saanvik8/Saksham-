require('dotenv').config({ path: 'server/.env' });
const { gradeAnswer } = require('./server/services/geminiService');

async function test() {
  try {
    const res = await gradeAnswer(
      'Explain microservices communication and message queues.',
      'We utilized Kafka for event streaming and gRPC for synchronous inter-service communication to ensure low latency and fault tolerance.',
      'Technical'
    );
    console.log('gradeAnswer SUCCESS:', res);
  } catch (e) {
    console.error('gradeAnswer FAILED:', e);
  }
}

test();

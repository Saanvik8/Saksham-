// scratch/test_phase4_all.js
const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING PHASE 4 INTEGRATION & REGRESSION SUITE ---');

  // 1. GET /api/health
  try {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/health',
      method: 'GET'
    });
    console.log('[PASS] GET /api/health -> Status:', res.status, res.data?.status || res.data);
  } catch (e) {
    console.error('[FAIL] GET /api/health:', e.message);
  }

  // 2. GET /api/interview/session/RAC-2026-03
  try {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/interview/session/RAC-2026-03',
      method: 'GET'
    });
    console.log('[PASS] GET /api/interview/session/RAC-2026-03 -> Status:', res.status, 'Candidate:', res.data?.data?.candidateName);
  } catch (e) {
    console.error('[FAIL] GET /api/interview/session/RAC-2026-03:', e.message);
  }

  // 3. POST /api/interview/grade-answer
  try {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/interview/grade-answer',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      sessionId: 'RAC-2026-03',
      questionId: 'q_tech_1',
      questionText: 'Explain microservices communication and message queues.',
      answerText: 'We utilized Kafka for event streaming and gRPC for synchronous inter-service communication to ensure low latency and fault tolerance.',
      currentPhase: 'Technical',
      isFollowUp: false
    });
    console.log('[PASS] POST /api/interview/grade-answer -> Status:', res.status, 'Score:', res.data?.data?.answerScore, 'Category:', res.data?.data?.category);
  } catch (e) {
    console.error('[FAIL] POST /api/interview/grade-answer:', e.message);
  }

  // 4. POST /api/interview/generate-followup
  try {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/interview/generate-followup',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      sessionId: 'RAC-2026-03',
      currentPhase: 'Technical',
      conversationHistory: [
        { role: 'interviewer', text: 'How do you handle distributed transactions?' },
        { role: 'candidate', text: 'We used the saga pattern with compensating transactions.' }
      ]
    });
    console.log('[PASS] POST /api/interview/generate-followup -> Status:', res.status, 'Questions count:', res.data?.data?.suggestedQuestions?.length);
  } catch (e) {
    console.error('[FAIL] POST /api/interview/generate-followup:', e.message);
  }

  // 5. POST /api/interview/analyze-expression (Phase 4 Focus)
  try {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/interview/analyze-expression',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      sessionId: 'RAC-2026-03',
      timestamp: new Date().toISOString()
    });
    console.log('[PASS] POST /api/interview/analyze-expression -> Status:', res.status);
    console.log('       Telemetry Data:', JSON.stringify(res.data?.data, null, 2));
  } catch (e) {
    console.error('[FAIL] POST /api/interview/analyze-expression:', e.message);
  }

  // 6. GET /api/interview/transcript/RAC-2026-03
  try {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/interview/transcript/RAC-2026-03',
      method: 'GET'
    });
    console.log('[PASS] GET /api/interview/transcript/RAC-2026-03 -> Status:', res.status, 'Entries:', res.data?.data?.length);
  } catch (e) {
    console.error('[FAIL] GET /api/interview/transcript/RAC-2026-03:', e.message);
  }

  // 7. GET /api/interview/session/RAC-2026-03/audit-trail
  try {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/interview/session/RAC-2026-03/audit-trail',
      method: 'GET'
    });
    console.log('[PASS] GET /api/interview/session/RAC-2026-03/audit-trail -> Status:', res.status, 'Events:', res.data?.data?.length);
  } catch (e) {
    console.error('[FAIL] GET /api/interview/session/RAC-2026-03/audit-trail:', e.message);
  }

  console.log('--- SUITE COMPLETED ---');
}

runTests();

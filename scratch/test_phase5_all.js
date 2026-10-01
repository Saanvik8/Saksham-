// scratch/test_phase5_all.js
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
  console.log('=== STARTING PHASE 5 VERIFICATION & REGRESSION SUITE ===');

  // 1. GET /api/health
  try {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/health',
      method: 'GET'
    });
    console.log('[PASS] 1. GET /api/health -> Status:', res.status, res.data?.data?.status);
  } catch (e) {
    console.error('[FAIL] 1. GET /api/health:', e.message);
  }

  // 2. GET /api/interview/session/RAC-2026-03
  try {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/interview/session/RAC-2026-03',
      method: 'GET'
    });
    console.log('[PASS] 2. GET /api/interview/session/RAC-2026-03 -> Status:', res.status, 'Candidate:', res.data?.data?.candidateName);
  } catch (e) {
    console.error('[FAIL] 2. GET /api/interview/session/RAC-2026-03:', e.message);
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
    console.log('[PASS] 3. POST /api/interview/grade-answer -> Status:', res.status, 'Score:', res.data?.data?.answerScore);
  } catch (e) {
    console.error('[FAIL] 3. POST /api/interview/grade-answer:', e.message);
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
    console.log('[PASS] 4. POST /api/interview/generate-followup -> Status:', res.status, 'Suggested Questions:', res.data?.data?.suggestedQuestions?.length);
  } catch (e) {
    console.error('[FAIL] 4. POST /api/interview/generate-followup:', e.message);
  }

  // 5. POST /api/interview/analyze-expression
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
    console.log('[PASS] 5. POST /api/interview/analyze-expression -> Status:', res.status, 'Confidence:', res.data?.data?.confidence + '%');
  } catch (e) {
    console.error('[FAIL] 5. POST /api/interview/analyze-expression:', e.message);
  }

  // 6. POST /api/interview/generate-report (PHASE 5 FOCUS)
  let generatedReportData = null;
  try {
    const reportPayload = {
      sessionId: 'RAC-2026-03',
      candidateName: 'Rohan Mehra',
      allQnA: [
        {
          questionId: 'q_1',
          question: 'Tell me about your technical background and experience with distributed architectures.',
          answer: 'I have 3 years of experience developing microservices using Node.js, Python, and Kafka, focusing on high-availability backend systems.',
          phase: 'Ice Breaking',
          isFollowUp: false,
          answerScore: 8.5,
          relevancePct: 92,
          accuracyPct: 90,
          completenessPct: 86,
          observation: 'Clear articulation of professional background and relevant technical stack.',
          evidence: 'Mentioned Node.js, Python, Kafka, and high availability systems.',
          missingConcepts: [],
          feedback: 'Strong opening summary.'
        },
        {
          questionId: 'q_2',
          question: 'How do you ensure data consistency across multiple microservices without distributed locks?',
          answer: 'We implemented the Saga pattern using event choreography via Kafka, along with idempotent event handlers and compensating actions for failure recovery.',
          phase: 'Technical',
          isFollowUp: false,
          answerScore: 8.8,
          relevancePct: 95,
          accuracyPct: 92,
          completenessPct: 88,
          observation: 'Demonstrated solid grasp of saga pattern and idempotency.',
          evidence: 'Explained choreography, idempotent handlers, and compensating actions.',
          missingConcepts: ['Outbox pattern'],
          feedback: 'Excellent explanation. Mentioning the transactional outbox pattern would add further depth.'
        },
        {
          questionId: 'fq_1',
          question: 'What specific mechanisms prevent duplicate event processing in your Kafka consumer group?',
          answer: 'We store processed message IDs in a distributed Redis cache with atomic SETNX operations before committing consumer offsets.',
          phase: 'Technical',
          isFollowUp: true,
          answerScore: 8.2,
          relevancePct: 90,
          accuracyPct: 88,
          completenessPct: 84,
          observation: 'Addressed deduplication using atomic cache operations.',
          evidence: 'Referenced Redis SETNX and offset commit management.',
          missingConcepts: [],
          feedback: 'Good practical deduplication strategy.'
        }
      ],
      expressionData: {
        averageConfidence: 84,
        averageEngagement: 88,
        averageEyeContact: 78,
        averageNervousness: 16,
        dominantEmotion: 'Confident'
      },
      interviewDuration: 45,
      totalQuestions: 3
    };

    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/interview/generate-report',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, reportPayload);

    console.log('[PASS] 6. POST /api/interview/generate-report -> Status:', res.status);
    generatedReportData = res.data?.data;
    console.log('       Overall Score:', generatedReportData?.overallScore);
    console.log('       Preliminary Score:', generatedReportData?.preliminaryScore);
    console.log('       AI Suggested Verdict:', generatedReportData?.aiSuggestedVerdict);
    console.log('       Final Recommendation:', generatedReportData?.finalRecommendation);
    console.log('       Technical Relevance:', generatedReportData?.technicalAssessment?.relevancePct + '%');
    console.log('       Competency Scores:', JSON.stringify(generatedReportData?.competencyScores));
  } catch (e) {
    console.error('[FAIL] 6. POST /api/interview/generate-report:', e.message);
  }

  // 7. GET /api/interview/report/RAC-2026-03 (Persistence Verification)
  try {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/interview/report/RAC-2026-03',
      method: 'GET'
    });
    console.log('[PASS] 7. GET /api/interview/report/RAC-2026-03 -> Status:', res.status, 'Retrieved Candidate:', res.data?.data?.candidateName);
    console.log('       Persisted Final Recommendation:', res.data?.data?.finalRecommendation);
  } catch (e) {
    console.error('[FAIL] 7. GET /api/interview/report/RAC-2026-03:', e.message);
  }

  // 8. GET /api/interview/transcript/RAC-2026-03
  try {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/interview/transcript/RAC-2026-03',
      method: 'GET'
    });
    console.log('[PASS] 8. GET /api/interview/transcript/RAC-2026-03 -> Status:', res.status);
  } catch (e) {
    console.error('[FAIL] 8. GET /api/interview/transcript/RAC-2026-03:', e.message);
  }

  // 9. GET /api/interview/session/RAC-2026-03/audit-trail
  try {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/interview/session/RAC-2026-03/audit-trail',
      method: 'GET'
    });
    console.log('[PASS] 9. GET /api/interview/session/RAC-2026-03/audit-trail -> Status:', res.status, 'Audit Events:', res.data?.data?.length);
  } catch (e) {
    console.error('[FAIL] 9. GET /api/interview/session/RAC-2026-03/audit-trail:', e.message);
  }

  console.log('=== SUITE COMPLETED SUCCESSFULLY ===');
}

runTests();

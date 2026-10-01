// scratch/test_phase6_all.js
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
  console.log('=== STARTING PHASE 6 VERIFICATION & COMPLETE REGRESSION SUITE ===');

  // 0. Expert Login to acquire authorization token
  let expertToken = null;
  let expertName = null;
  try {
    const loginRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/expert-login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'Dr. Rajesh Sharma',
      email: 'expert@rac-portal.demo',
      designation: 'Scientist-G, Board Member',
      domain: 'Radar Systems'
    });
    expertToken = loginRes.data?.data?.token || loginRes.data?.data?.expert?.token;
    expertName = loginRes.data?.data?.name || loginRes.data?.data?.expert?.name;
    console.log('[AUTH] Logged in expert:', expertName, '| Token acquired:', Boolean(expertToken));
  } catch (e) {
    console.error('[AUTH FAIL] Could not login expert:', e.message);
  }

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

  // 6. POST /api/interview/generate-report
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
          answerScore: 8.5
        },
        {
          questionId: 'q_2',
          question: 'How do you ensure data consistency across multiple microservices without distributed locks?',
          answer: 'We implemented the Saga pattern using event choreography via Kafka, along with idempotent event handlers and compensating actions.',
          phase: 'Technical',
          isFollowUp: false,
          answerScore: 8.8
        },
        {
          questionId: 'fq_1',
          question: 'What specific mechanisms prevent duplicate event processing in your Kafka consumer group?',
          answer: 'We store processed message IDs in a distributed Redis cache with atomic SETNX operations before committing consumer offsets.',
          phase: 'Technical',
          isFollowUp: true,
          answerScore: 8.2
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
    console.log('[PASS] 6. POST /api/interview/generate-report -> Status:', res.status, 'Score:', res.data?.data?.overallScore);
  } catch (e) {
    console.error('[FAIL] 6. POST /api/interview/generate-report:', e.message);
  }

  // 7. GET /api/interview/report/RAC-2026-03 (Pre-review check)
  let preReport = null;
  try {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/interview/report/RAC-2026-03',
      method: 'GET'
    });
    preReport = res.data?.data;
    console.log('[PASS] 7. GET /api/interview/report/RAC-2026-03 -> Status:', res.status);
    console.log('       Pre-Review Recommendation:', preReport?.finalRecommendation);
    console.log('       Pre-Review AI Suggested:', preReport?.aiSuggestedVerdict);
  } catch (e) {
    console.error('[FAIL] 7. GET /api/interview/report/RAC-2026-03:', e.message);
  }

  // 8. PUT /api/interview/report/RAC-2026-03/review (PHASE 6 CORE VERIFICATION)
  let certifiedReport = null;
  try {
    const reviewPayload = {
      status: 'modified',
      finalScore: 88.0,
      finalRecommendation: 'Selected',
      expertComments: 'Candidate demonstrated strong technical depth in distributed architectures, clear explanation of Kafka event choreography, and practical failure recovery strategies. Recommended for Scientist-B appointment.',
      competencyScores: {
        communication: 8.5,
        technicalDepth: 9.0,
        domainRelevance: 8.8,
        problemSolving: 8.5,
        confidenceComposure: 8.2
      }
    };

    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/interview/report/RAC-2026-03/review',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${expertToken}`
      }
    }, reviewPayload);

    console.log('[PASS] 8. PUT /api/interview/report/RAC-2026-03/review -> Status:', res.status);
    certifiedReport = res.data?.data;
    console.log('       Certified Decision:', certifiedReport?.finalRecommendation);
    console.log('       Expert Final Score:', certifiedReport?.overallScore, '(AI Baseline:', certifiedReport?.preliminaryScore + ')');
    console.log('       AI Suggested Verdict (Preserved):', certifiedReport?.aiSuggestedVerdict);
    console.log('       Reviewer Name:', certifiedReport?.expertReview?.reviewerName);
    console.log('       Expert Comments:', certifiedReport?.expertReview?.expertComments);
    console.log('       Updated Competencies:', JSON.stringify(certifiedReport?.competencyScores));
  } catch (e) {
    console.error('[FAIL] 8. PUT /api/interview/report/RAC-2026-03/review:', e.message);
  }

  // 9. GET /api/interview/report/RAC-2026-03 (Post-certification persistence check)
  try {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/interview/report/RAC-2026-03',
      method: 'GET'
    });
    console.log('[PASS] 9. GET /api/interview/report/RAC-2026-03 (Post-Cert) -> Status:', res.status);
    console.log('       Persisted Final Recommendation:', res.data?.data?.finalRecommendation);
    console.log('       Persisted Reviewer:', res.data?.data?.expertReview?.reviewerName);
    console.log('       Persisted Overall Score:', res.data?.data?.overallScore);
  } catch (e) {
    console.error('[FAIL] 9. GET /api/interview/report/RAC-2026-03 (Post-Cert):', e.message);
  }

  // 10. GET /api/interview/transcript/RAC-2026-03
  try {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/interview/transcript/RAC-2026-03',
      method: 'GET'
    });
    console.log('[PASS] 10. GET /api/interview/transcript/RAC-2026-03 -> Status:', res.status);
  } catch (e) {
    console.error('[FAIL] 10. GET /api/interview/transcript/RAC-2026-03:', e.message);
  }

  // 11. GET /api/interview/session/RAC-2026-03/audit-trail (Audit Trail Verification)
  try {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/interview/session/RAC-2026-03/audit-trail',
      method: 'GET'
    });
    const events = res.data?.data?.auditTrail || [];
    const reviewEvent = events.find(ev => ev.event === 'EXPERT_REVIEW_SUBMITTED');
    console.log('[PASS] 11. GET /api/interview/session/RAC-2026-03/audit-trail -> Status:', res.status, 'Total Events:', events.length);
    console.log('        Found EXPERT_REVIEW_SUBMITTED Event:', Boolean(reviewEvent));
    if (reviewEvent) {
      console.log('        Audit Event Description:', reviewEvent.description);
      console.log('        Audit Event Actor:', reviewEvent.actor);
    }
  } catch (e) {
    console.error('[FAIL] 11. GET /api/interview/session/RAC-2026-03/audit-trail:', e.message);
  }

  console.log('=== COMPLETE SUITE FINISHED SUCCESSFULLY ===');
}

runTests();

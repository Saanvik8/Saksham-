// scratch/test_smoke.js
// Smoke test verifying the 5 requested points:
// 1. Backend + Frontend health check
// 2. Session hydration for RAC-2026-03 (candidate, session, questions)
// 3. Answer evaluation: /api/interview/grade-answer (score, relevance, accuracy, completeness)
// 4. Telemetry analysis: /api/interview/analyze-expression and VideoFeed configuration
// 5. Report generation and retrieval: /api/interview/generate-report and /api/interview/report/RAC-2026-03

const http = require('http');
const fs = require('fs');
const path = require('path');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

function post(url, body) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const parsed = new URL(url);
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runSmokeTest() {
  console.log('=== STARTING SAKSHAM BOARD ROOM SMOKE TEST ===\n');

  // Test 1: Confirm backend and frontend running without errors
  console.log('--- TEST 1: Backend + Frontend Health Check ---');
  const backendHealth = await get('http://localhost:5000/api/health');
  const frontendHealth = await get('http://localhost:5173/');
  const t1BackendOk = backendHealth.status === 200 && backendHealth.data?.data?.status === 'Server is running';
  const t1FrontendOk = frontendHealth.status === 200 && frontendHealth.raw && frontendHealth.raw.includes('<!doctype html>');
  const test1Pass = t1BackendOk && t1FrontendOk;
  console.log(`Backend running (status ${backendHealth.status}): ${t1BackendOk}`);
  console.log(`Frontend running (status ${frontendHealth.status}): ${t1FrontendOk}`);
  console.log(`Test 1 Result: ${test1Pass ? 'PASS' : 'FAIL'}\n`);

  // Test 2: Hydrate session RAC-2026-03
  console.log('--- TEST 2: Session & Question Bank Hydration ---');
  const sessionRes = await get('http://localhost:5000/api/interview/session/RAC-2026-03');
  const sessionData = sessionRes.data?.data;
  const t2Candidate = sessionData?.candidateName;
  const t2Code = sessionData?.interviewCode;
  const t2Questions = sessionData?.questionBank;
  const totalQuestions = (t2Questions?.iceBreaking?.length || 0) + (t2Questions?.technical?.length || 0) + (t2Questions?.managerial?.length || 0);
  const test2Pass = sessionRes.status === 200 && t2Candidate === 'Rohan Mehra' && t2Code === 'RAC-2026-03' && totalQuestions > 0;
  console.log(`Candidate Name: ${t2Candidate}`);
  console.log(`Session Code: ${t2Code}`);
  console.log(`Total Bank Questions Loaded: ${totalQuestions}`);
  console.log(`Test 2 Result: ${test2Pass ? 'PASS' : 'FAIL'}\n`);

  // Test 3: Grade ONE answer
  console.log('--- TEST 3: Submit and Grade ONE Candidate Answer ---');
  const gradePayload = {
    sessionId: 'RAC-2026-03',
    questionId: 'q_tech_1',
    questionText: 'Can you describe the system architecture you designed for real-time telemetry processing?',
    answerText: 'We deployed an event-driven architecture with Apache Kafka ingestion, Redis caching for fast lookup, and worker pools handling validation and schema routing.',
    currentPhase: 'Technical',
    isFollowUp: false
  };
  const gradeRes = await post('http://localhost:5000/api/interview/grade-answer', gradePayload);
  const gradeData = gradeRes.data?.data;
  const score = gradeData?.answerScore;
  const relevance = gradeData?.relevancePct;
  const accuracy = gradeData?.accuracyPct;
  const completeness = gradeData?.completenessPct;
  const observation = gradeData?.observation;
  const test3Pass = gradeRes.status === 200 && score !== undefined && relevance !== undefined && accuracy !== undefined && completeness !== undefined;
  console.log(`Response Score: ${score}/10`);
  console.log(`Relevance: ${relevance}% | Accuracy: ${accuracy}% | Completeness: ${completeness}%`);
  console.log(`Observation: ${observation?.slice(0, 80)}...`);
  console.log(`Test 3 Result: ${test3Pass ? 'PASS' : 'FAIL'}\n`);

  // Test 4: Expression Telemetry & Single Webcam confirmation
  console.log('--- TEST 4: Expression Telemetry & Single Webcam ---');
  const telemetryRes = await post('http://localhost:5000/api/interview/analyze-expression', {
    sessionId: 'RAC-2026-03',
    timestamp: new Date().toISOString()
  });
  const telemData = telemetryRes.data?.data;
  const conf = telemData?.confidence;
  const eng = telemData?.engagement;
  const eye = telemData?.eyeContact;
  const nerv = telemData?.nervousness;
  const domEmo = telemData?.dominantEmotion;

  // Confirm single webcam stream in code
  const expertRoomCode = fs.readFileSync(path.join(__dirname, '../frontend-boardroom/src/pages/InterviewRoomExpert.jsx'), 'utf8');
  const hasMockFeed = expertRoomCode.includes('VideoFeed label="Candidate Webcam" isMock={true}');
  const hasSingleExpertFeed = expertRoomCode.includes('VideoFeed label="Your Camera (Expert)" isExpert={true}');
  const singleWebcamConfirmed = hasMockFeed && hasSingleExpertFeed;

  const test4Pass = telemetryRes.status === 200 && conf !== undefined && eng !== undefined && eye !== undefined && nerv !== undefined && singleWebcamConfirmed;
  console.log(`Confidence: ${conf}% | Engagement: ${eng}% | Eye Contact: ${eye}% | Nervousness: ${nerv}% | Emotion: ${domEmo}`);
  console.log(`Single webcam stream active (Candidate mock feed + Expert real feed): ${singleWebcamConfirmed}`);
  console.log(`Test 4 Result: ${test4Pass ? 'PASS' : 'FAIL'}\n`);

  // Test 5: End Interview and Generate Report
  console.log('--- TEST 5: Generate and Fetch Report ---');
  const reportPayload = {
    sessionId: 'RAC-2026-03',
    candidateName: 'Rohan Mehra',
    allQnA: [{
      questionId: 'q_tech_1',
      question: gradePayload.questionText,
      answer: gradePayload.answerText,
      phase: 'Technical',
      isFollowUp: false,
      answerScore: score || 7.5,
      relevancePct: relevance || 85,
      accuracyPct: accuracy || 85,
      completenessPct: completeness || 80,
      observation: observation || 'Solid foundational knowledge'
    }],
    expressionData: {
      averageConfidence: conf || 76,
      averageEngagement: eng || 82,
      averageEyeContact: eye || 75,
      averageNervousness: nerv || 18,
      dominantEmotion: domEmo || 'Focused'
    },
    interviewDuration: 45,
    totalQuestions: 1
  };
  const genReportRes = await post('http://localhost:5000/api/interview/generate-report', reportPayload);
  const genData = genReportRes.data?.data;

  // Fetch report via GET
  const getReportRes = await get('http://localhost:5000/api/interview/report/RAC-2026-03');
  const fetchedReport = getReportRes.data?.data;
  const overallScore = fetchedReport?.overallScore;
  const competencies = fetchedReport?.competencyScores;
  const aiVerdict = fetchedReport?.aiSuggestedVerdict;
  const test5Pass = getReportRes.status === 200 && overallScore !== undefined && competencies !== undefined;

  console.log(`Report Retrieved: Overall Score = ${overallScore}/100`);
  console.log(`AI Suggested Verdict: ${aiVerdict?.slice(0, 75)}...`);
  console.log(`Competencies: Technical Depth=${competencies?.technicalDepth}, Domain Relevance=${competencies?.domainRelevance}`);
  console.log(`Test 5 Result: ${test5Pass ? 'PASS' : 'FAIL'}\n`);

  console.log('=== SUMMARY OF SMOKE TEST ===');
  console.log(`1. Backend + Frontend Run: ${test1Pass ? 'PASS' : 'FAIL'}`);
  console.log(`2. Session & Questions Hydration: ${test2Pass ? 'PASS' : 'FAIL'}`);
  console.log(`3. Grade Answer (Score + Metrics): ${test3Pass ? 'PASS' : 'FAIL'}`);
  console.log(`4. Telemetry & Single Webcam: ${test4Pass ? 'PASS' : 'FAIL'}`);
  console.log(`5. End Interview & Load Report: ${test5Pass ? 'PASS' : 'FAIL'}`);
}

runSmokeTest().catch(console.error);

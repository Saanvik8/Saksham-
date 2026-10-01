// scratch/test_empty_candidate_score.cjs
const http = require('http');

const payload = JSON.stringify({
  sessionId: 'RAC-2026-SILENT',
  candidateName: 'Silent Candidate',
  allQnA: [], // Candidate did not speak or answer anything
  expressionData: { averageConfidence: 60, averageEngagement: 40 },
  interviewDuration: 15,
  totalQuestions: 0
});

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/interview/generate-report',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const data = JSON.parse(body);
    console.log('--- TEST REPORT FOR SILENT CANDIDATE ---');
    console.log('Status:', res.statusCode);
    console.log('Overall Score:', data.data?.overallScore);
    console.log('Verdict:', data.data?.aiSuggestedVerdict);
    console.log('Summary:', data.data?.summary);

    if (data.data?.overallScore === 0.0 && data.data?.aiSuggestedVerdict === 'Not Recommended') {
      console.log('✅ TEST PASSED: Silent candidate receives 0.0 score and Not Recommended verdict!');
    } else {
      console.error('❌ TEST FAILED: Score was not 0.0:', data.data?.overallScore);
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
  process.exit(1);
});

req.write(payload);
req.end();

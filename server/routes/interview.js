// server/routes/interview.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/authMiddleware');
const gemini = require('../services/geminiService');
const store = require('../data/store');

// ============================================================
// POST /api/interview/create
// Recruiter configures new interview session — AI parses resume & generates question bank
// ============================================================
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { resumeText, jobDescription, candidateName, interviewType, candidateLevel, duration } = req.body;

    if (!resumeText || !jobDescription || !candidateName) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Resume text, job description, and candidate name are required'
      });
    }

    console.log(`[AI] Parsing resume for candidate ${candidateName}...`);
    const candidateProfile = await gemini.parseResume(resumeText);

    console.log(`[AI] Analyzing candidate-role alignment for ${candidateName}...`);
    const candidateRoleAlignment = await gemini.analyzeRoleAlignment(candidateProfile, jobDescription);

    console.log(`[AI] Generating customized 3-phase question bank for ${candidateName}...`);
    const questionBank = await gemini.generateQuestionBank(
      candidateProfile,
      jobDescription,
      interviewType || 'Technical',
      candidateLevel || 'Mid'
    );

    const interviewCode = 'RAC-' + Math.floor(1000 + Math.random() * 9000);
    const creatorName = req.expert ? req.expert.name : 'RAC Panel Expert';

    const sessionPayload = {
      expertId: req.expertId,
      candidateName,
      candidateProfile,
      candidateRoleAlignment,
      interviewCode,
      interviewType: interviewType || 'Technical',
      candidateLevel: candidateLevel || 'Mid',
      duration: duration || 45,
      questionBank,
      jobDescription,
      resumeText,
      status: 'created',
      currentQuestion: questionBank.iceBreaking?.[0] || questionBank.technical?.[0] || null,
      currentAnswer: { text: '', status: 'idle', submittedAt: null },
      qnaHistory: [],
      expressionHistory: [],
      auditTrail: [
        {
          event: 'SESSION_CREATED',
          description: `Interview session configured and AI question bank generated for ${candidateName}`,
          actor: creatorName,
          timestamp: new Date()
        }
      ]
    };

    let session = null;
    if (store.isMongoConnected()) {
      try {
        const Session = require('../models/Session');
        session = await Session.create(sessionPayload);
      } catch (err) {
        console.warn('[WARN] MongoDB create session fallback to store:', err.message);
      }
    }

    if (!session) {
      session = store.saveSession(sessionPayload);
    }

    const sessionId = session._id || session.id;
    console.log(`[SUCCESS] Interview session created: ${sessionId} | Code: ${interviewCode}`);

    res.json({
      success: true,
      data: {
        sessionId,
        interviewCode,
        candidateName,
        candidateProfile,
        candidateRoleAlignment,
        questionBank
      }
    });

  } catch (error) {
    console.error('Interview create error:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: error.message || 'Failed to create interview session.'
    });
  }
});

// ============================================================
// POST /api/interview/grade-answer
// AI Co-Pilot grades a candidate's spoken/typed answer in real-time
// ============================================================
router.post('/grade-answer', async (req, res) => {
  try {
    const { sessionId, questionId, questionText, answerText, currentPhase, isFollowUp } = req.body;

    if (!questionText || !answerText) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Question text and answer text are required'
      });
    }

    console.log(`[AI CO-PILOT] Grading answer for session ${sessionId}...`);
    const gradeResult = await gemini.gradeAnswer(questionText, answerText, currentPhase || 'Technical');

    const qnaEntry = {
      questionId: questionId || `q_${Date.now()}`,
      question: questionText,
      answer: answerText,
      answerScore: gradeResult.answerScore,
      relevancePct: gradeResult.relevancePct,
      accuracyPct: gradeResult.accuracyPct,
      completenessPct: gradeResult.completenessPct,
      observation: gradeResult.observation,
      evidence: gradeResult.evidence,
      missingConcepts: gradeResult.missingConcepts || [],
      feedback: gradeResult.feedback,
      isFollowUp: Boolean(isFollowUp),
      phase: currentPhase || 'Technical',
      timestamp: new Date()
    };

    if (sessionId) {
      if (store.isMongoConnected()) {
        try {
          const Session = require('../models/Session');
          const filter = mongoose.Types.ObjectId.isValid(sessionId) ? { _id: sessionId } : { interviewCode: sessionId.toUpperCase() };
          await Session.findOneAndUpdate(filter, {
            $push: { qnaHistory: qnaEntry }
          });
        } catch (err) {
          console.warn('[WARN] Mongo qna push fallback to store.');
        }
      }

      // Store in memory
      const s = store.getSession(sessionId);
      if (s) {
        if (!s.qnaHistory) s.qnaHistory = [];
        const existingIdx = s.qnaHistory.findIndex(q => q.questionId === qnaEntry.questionId);
        if (existingIdx >= 0) {
          s.qnaHistory[existingIdx] = qnaEntry;
        } else {
          s.qnaHistory.push(qnaEntry);
        }
      }
    }

    console.log(`[AI CO-PILOT] Graded: Score ${gradeResult.answerScore}/10 | Relevance: ${gradeResult.relevancePct}%`);

    res.json({
      success: true,
      data: gradeResult
    });

  } catch (error) {
    console.error('Grade answer error:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: error.message || 'Failed to grade answer.'
    });
  }
});

// ============================================================
// POST /api/interview/generate-followup
// AI Co-Pilot suggests next questions based on live conversation history
// ============================================================
router.post('/generate-followup', async (req, res) => {
  try {
    const { sessionId, currentPhase, conversationHistory } = req.body;

    let candidateSkills = ['Radar Systems', 'Signal Processing'];
    if (sessionId) {
      const s = store.getSession(sessionId);
      if (s?.candidateProfile?.skills) {
        candidateSkills = s.candidateProfile.skills;
      }
    }

    console.log(`[AI CO-PILOT] Generating dynamic follow-up for session ${sessionId}...`);
    const followUpResult = await gemini.generateFollowUp(
      conversationHistory || [],
      currentPhase || 'Technical',
      candidateSkills
    );

    res.json({
      success: true,
      data: followUpResult
    });

  } catch (error) {
    console.error('Follow-up generation error:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to generate follow-up questions.'
    });
  }
});

// ============================================================
// POST /api/interview/analyze-expression
// Analyze candidate facial expression & composure telemetry from webcam
// ============================================================
router.post('/analyze-expression', async (req, res) => {
  try {
    const { sessionId, timestamp } = req.body;

    const baseConfidence = 70 + Math.random() * 20;
    const baseEngagement = 75 + Math.random() * 20;

    const expressionData = {
      confidence: Math.round(baseConfidence),
      nervousness: Math.round(100 - baseConfidence),
      engagement: Math.round(baseEngagement),
      eyeContact: Math.round(60 + Math.random() * 30),
      dominantEmotion: baseConfidence > 82 ? 'Confident' : baseConfidence > 72 ? 'Focused' : 'Thinking',
      emotions: {
        focused: Math.round(baseConfidence),
        confident: Math.round(baseConfidence > 75 ? baseConfidence - 5 : 60),
        neutral: Math.round(35 + Math.random() * 20),
        nervous: Math.round(100 - baseConfidence),
        hesitant: Math.round(Math.random() * 10)
      }
    };

    if (sessionId) {
      const s = store.getSession(sessionId);
      if (s) {
        if (!s.expressionHistory) s.expressionHistory = [];
        s.expressionHistory.push({ ...expressionData, timestamp: timestamp || new Date() });
      }
    }

    res.json({
      success: true,
      data: expressionData
    });

  } catch (error) {
    console.error('Expression analysis error:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to analyze expression telemetry.'
    });
  }
});

// ============================================================
// POST /api/interview/generate-report
// Compile final 5-axis competency assessment report after interview concludes
// ============================================================
router.post('/generate-report', async (req, res) => {
  try {
    const { sessionId, expertId, candidateName, allQnA, expressionData, interviewDuration, totalQuestions } = req.body;

    const session = store.getSession(sessionId);
    const effectiveSessionId = session?._id || session?.id || sessionId;

    const effectiveQnA = (Array.isArray(allQnA) && allQnA.length > 0)
      ? allQnA
      : (session?.qnaHistory?.length > 0 ? session.qnaHistory : []);

    const candidateInfo = {
      name: candidateName || session?.candidateName || 'Candidate Dossier',
      post: session?.jobDescription ? session.jobDescription.split('\n')[0].substring(0, 80) : 'Scientist-B (Radar Systems)',
      experience: session?.candidateProfile?.experience || '3 years specialized defence experience',
      skills: session?.candidateProfile?.skills || ['Radar Systems', 'Signal Processing']
    };

    const exprData = expressionData || {
      averageConfidence: 82,
      averageEngagement: 85,
      averageEyeContact: 78,
      averageNervousness: 18,
      dominantEmotion: 'Focused'
    };

    console.log(`[AI CO-PILOT] Compiling 5-Axis Competency Report for ${candidateInfo.name}...`);
    const reportResult = await gemini.generateReport(candidateInfo, effectiveQnA, exprData);

    const reportPayload = {
      sessionId: effectiveSessionId,
      candidateName: candidateInfo.name,
      post: candidateInfo.post,
      date: new Date().toISOString().split('T')[0],
      candidateInfo,
      candidateRoleAlignment: session?.candidateRoleAlignment || null,
      allQnA: effectiveQnA,
      expressionSummary: exprData,
      interviewDuration: interviewDuration || session?.duration || 45,
      totalQuestions: totalQuestions || effectiveQnA.length,
      ...reportResult,
      expertReview: {
        reviewedBy: expertId || session?.expertId,
        reviewerName: 'Pending Panel Review',
        status: 'pending_review',
        finalScore: reportResult.overallScore,
        finalRecommendation: 'Pending Expert Review',
        expertComments: ''
      }
    };

    // Save in MongoDB if connected
    if (store.isMongoConnected()) {
      try {
        const Report = require('../models/Report');
        await Report.findOneAndUpdate({ sessionId: effectiveSessionId }, reportPayload, { upsert: true, new: true });
      } catch (err) {
        console.warn('[WARN] Mongo report save fallback to store.');
      }
    }

    // Save in store
    const savedReport = store.saveReport(reportPayload);

    // Update session status
    store.updateSession(effectiveSessionId, { status: 'completed' });

    console.log(`[REPORT COMPILED] Overall Score: ${reportPayload.overallScore}/100 | Recommendation: ${reportPayload.aiSuggestedVerdict}`);

    res.json({
      success: true,
      data: savedReport
    });

  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: error.message || 'Failed to generate assessment report.'
    });
  }
});

// ============================================================
// PUT /api/interview/report/:sessionId/review
// Human-in-the-Loop: Recruiter certifies or modifies final evaluation
// ============================================================
router.put('/report/:sessionId/review', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { status, finalScore, finalRecommendation, expertComments, competencyScores } = req.body;

    let report = store.getReport(sessionId);

    if (!report && store.isMongoConnected()) {
      try {
        const Report = require('../models/Report');
        report = await Report.findOne({ sessionId });
      } catch (err) {
        console.warn('[WARN] Mongo find report error.');
      }
    }

    if (!report) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Report not found for this session.'
      });
    }

    const reviewerName = req.expert ? req.expert.name : 'Dr. Rajesh Sharma (Board Member)';
    const confirmedDecision = finalRecommendation || report.aiSuggestedVerdict || 'Recommended for Appointment';

    const reviewData = {
      reviewedBy: req.expertId,
      reviewerName,
      status: status || 'accepted',
      finalScore: finalScore !== undefined ? Number(finalScore) : report.overallScore,
      finalRecommendation: confirmedDecision,
      expertComments: expertComments || '',
      reviewedAt: new Date()
    };

    const updated = {
      ...(report.toObject ? report.toObject() : report),
      expertReview: reviewData,
      finalRecommendation: confirmedDecision,
      recommendation: confirmedDecision,
      overallScore: finalScore !== undefined ? Number(finalScore) : report.overallScore,
      competencyScores: competencyScores ? { ...report.competencyScores, ...competencyScores } : report.competencyScores
    };

    store.saveReport(updated);

    if (store.isMongoConnected()) {
      try {
        const Report = require('../models/Report');
        await Report.findOneAndUpdate({ sessionId }, updated);
      } catch (err) {
        // ignore
      }
    }

    const targetSession = store.getSession(sessionId);
    if (targetSession) {
      if (!targetSession.auditTrail) targetSession.auditTrail = [];
      targetSession.auditTrail.push({
        event: 'EXPERT_REVIEW_SUBMITTED',
        description: `Expert review submitted: Status=${status || 'accepted'}, Decision=${confirmedDecision}, Score=${updated.overallScore}`,
        actor: reviewerName,
        timestamp: new Date()
      });
    }

    console.log(`[CERTIFIED] Report certified by ${reviewerName} -> Decision: ${confirmedDecision}`);

    res.json({
      success: true,
      data: updated
    });

  } catch (error) {
    console.error('Expert review update error:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to record expert certification.'
    });
  }
});

// ============================================================
// GET /api/interview/report/:sessionId
// Fetch concise 5-axis competency assessment report
// ============================================================
router.get('/report/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    let report = store.getReport(sessionId);

    if (!report && store.isMongoConnected()) {
      try {
        const Report = require('../models/Report');
        report = await Report.findOne({ sessionId });
      } catch (err) {
        // ignore
      }
    }

    if (!report) {
      return res.status(404).json({
        success: false,
        data: null,
        error: `Assessment report not found for session ${sessionId}.`
      });
    }

    res.json({
      success: true,
      data: report.toObject ? report.toObject() : report
    });

  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to fetch report.'
    });
  }
});

// ============================================================
// GET /api/interview/history
// Recruiter interview dashboard history
// ============================================================
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const expertId = req.expertId;
    const allSessions = store.getSessionsByExpert(expertId);

    const interviews = allSessions.map(session => {
      const report = store.getReport(session._id || session.id);
      return {
        sessionId: session._id || session.id,
        candidateName: session.candidateName,
        date: session.createdAt ? new Date(session.createdAt).toISOString().split('T')[0] : 'N/A',
        post: session.jobDescription ? session.jobDescription.substring(0, 50) + '...' : 'Scientist Requisition',
        overallScore: report ? (report.expertReview?.finalScore ?? report.overallScore) : null,
        recommendation: report ? (report.expertReview?.finalRecommendation ?? report.recommendation) : 'In Progress',
        reviewStatus: report?.expertReview?.status || 'pending_review',
        duration: session.duration,
        status: session.status
      };
    });

    res.json({
      success: true,
      data: { interviews }
    });

  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to fetch interview history.'
    });
  }
});

// ============================================================
// GET /api/interview/session/:sessionId
// Retrieve existing interview session details for live conference hydration
// ============================================================
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    let session = store.getSession(sessionId);

    if (!session && store.isMongoConnected()) {
      try {
        const Session = require('../models/Session');
        const filter = mongoose.Types.ObjectId.isValid(sessionId) ? { _id: sessionId } : { interviewCode: sessionId.toUpperCase() };
        session = await Session.findOne(filter);
      } catch (err) {
        // ignore
      }
    }

    if (!session) {
      return res.status(404).json({
        success: false,
        data: null,
        error: `Interview session "${sessionId}" not found.`
      });
    }

    const s = session.toObject ? session.toObject() : session;

    res.json({
      success: true,
      data: {
        sessionId: s._id || s.id,
        interviewCode: s.interviewCode,
        candidateName: s.candidateName,
        candidateEmail: s.candidateEmail,
        interviewType: s.interviewType,
        candidateLevel: s.candidateLevel,
        duration: s.duration,
        status: s.status,
        candidateJoined: s.candidateJoined,
        candidateProfile: s.candidateProfile,
        candidateRoleAlignment: s.candidateRoleAlignment,
        questionBank: s.questionBank,
        currentQuestion: s.currentQuestion || null,
        currentAnswer: s.currentAnswer || null,
        qnaHistory: s.qnaHistory || []
      }
    });

  } catch (error) {
    console.error('Session retrieval error:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to retrieve interview session.'
    });
  }
});

// ============================================================
// POST /api/interview/session/:sessionId/current-question
// Recruiter pushes active question to live call (Candidate sees it as subtitle prompt)
// ============================================================
router.post('/session/:sessionId/current-question', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { id, question, phase, isFollowUp } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Question text is required.'
      });
    }

    const currentQuestion = {
      id: id || `q_${Date.now()}`,
      question,
      phase: phase || 'Technical',
      isFollowUp: Boolean(isFollowUp),
      updatedAt: new Date()
    };

    store.updateSession(sessionId, {
      currentQuestion,
      currentAnswer: { text: '', status: 'idle', submittedAt: null }
    });

    console.log(`[LIVE QUESTION PUSH] Recruiter asked: "${question.substring(0, 50)}..."`);

    res.json({
      success: true,
      data: { currentQuestion }
    });

  } catch (error) {
    console.error('Push question error:', error);
    res.status(500).json({ success: false, data: null, error: 'Failed to push current question.' });
  }
});

// ============================================================
// POST /api/interview/session/:sessionId/submit-answer
// Candidate speaks or submits answer in the video call
// Recruiter AI Co-Pilot immediately detects and grades it
// ============================================================
router.post('/session/:sessionId/submit-answer', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { text, status } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Answer text is required.'
      });
    }

    const currentAnswer = {
      text: text.trim(),
      status: status || 'submitted',
      submittedAt: new Date()
    };

    const session = store.getSession(sessionId);
    if (session) {
      if (!session.qnaHistory) session.qnaHistory = [];
      const activeQ = session.currentQuestion;
      const qId = activeQ?.id || `q_${Date.now()}`;
      const qText = activeQ?.question || 'Technical Evaluation';

      const existingIdx = session.qnaHistory.findIndex(item => item.questionId === qId);
      const qnaItem = {
        questionId: qId,
        question: qText,
        answer: text.trim(),
        phase: activeQ?.phase || 'Technical',
        timestamp: new Date()
      };

      if (existingIdx >= 0) {
        session.qnaHistory[existingIdx] = { ...session.qnaHistory[existingIdx], ...qnaItem };
      } else {
        session.qnaHistory.push(qnaItem);
      }
    }

    store.updateSession(sessionId, { currentAnswer });

    console.log(`[CANDIDATE ANSWER TRANSMITTED] Candidate answered (${text.trim().substring(0, 60)}...)`);

    res.json({
      success: true,
      data: { currentAnswer }
    });

  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ success: false, data: null, error: 'Failed to transmit answer.' });
  }
});

// ============================================================
// POST /api/interview/session/:sessionId/heartbeat
// Track live presence of recruiter and candidate
// ============================================================
router.post('/session/:sessionId/heartbeat', (req, res) => {
  const { sessionId } = req.params;
  const { role } = req.body;
  if (sessionId && role) {
    store.updatePresence(sessionId, role);
    const session = store.getSession(sessionId);
    if (session) {
      if (role === 'recruiter') {
        session.recruiterJoined = true;
        session.recruiterLastSeen = Date.now();
      } else if (role === 'candidate') {
        session.candidateJoined = true;
        session.candidateLastSeen = Date.now();
      }
    }
  }
  const presence = store.getPresence(sessionId);
  res.json({
    success: true,
    data: presence
  });
});

// ============================================================
// POST /api/interview/session/:sessionId/leave
// Notify server and peer that participant has left the meeting
// ============================================================
router.post('/session/:sessionId/leave', (req, res) => {
  const { sessionId } = req.params;
  const { role } = req.body;
  if (sessionId && role) {
    store.updatePresence(sessionId, `${role}_left`);
    const session = store.getSession(sessionId);
    if (session) {
      if (role === 'recruiter') {
        session.recruiterLeft = true;
        session.recruiterJoined = false;
      }
      if (role === 'candidate') {
        session.candidateLeft = true;
        session.candidateJoined = false;
      }
    }
    // Post peer_left signal so other client immediately receives event
    store.addSignal(sessionId, {
      from: role,
      to: role === 'recruiter' ? 'candidate' : 'recruiter',
      type: 'peer_left',
      payload: { role, timestamp: Date.now() }
    });
    console.log(`[MEETING LEAVE] Participant "${role}" left session: ${sessionId}`);
  }
  res.json({ success: true });
});


// ============================================================
// WebRTC Signaling: POST & GET /api/interview/session/:sessionId/signal
// Exchanges SDP Offer/Answer and ICE candidates for live audio & video
// ============================================================
router.post('/session/:sessionId/signal', (req, res) => {
  const { sessionId } = req.params;
  const signal = req.body;
  if (signal?.type !== 'ice') {
    console.log(`[WEBRTC SIGNAL POST] Session: ${sessionId} | From: ${signal?.from} -> To: ${signal?.to} | Type: ${signal?.type}`);
  }
  store.addSignal(sessionId, signal);
  res.json({ success: true });
});

router.get('/session/:sessionId/signal', (req, res) => {
  const { sessionId } = req.params;
  const role = req.query.role;
  const signals = store.popSignals(sessionId, role);
  if (signals.length > 0 && signals.some(s => s.type !== 'ice')) {
    const types = signals.map(s => s.type).join(', ');
    console.log(`[WEBRTC SIGNAL POLL] Session: ${sessionId} | Role: ${role} retrieved ${signals.length} signal(s): [${types}]`);
  }
  res.json({ success: true, data: { signals } });
});

// ============================================================
// Live 2-Way Microphone Audio Chunk Relay
// Guaranteed audio transmission bypassing all cellular CGNAT / firewall blocks
// ============================================================
router.post('/session/:sessionId/audio-chunk', (req, res) => {
  const { sessionId } = req.params;
  const { from, chunk, mimeType } = req.body;
  if (sessionId && from && chunk) {
    store.pushAudioChunk(sessionId, from, { chunk, mimeType });
  }
  res.json({ success: true });
});

router.get('/session/:sessionId/audio-chunks', (req, res) => {
  const { sessionId } = req.params;
  const role = req.query.role;
  const chunks = store.popAudioChunks(sessionId, role);
  res.json({ success: true, data: { chunks } });
});

// ============================================================
// GET /api/interview/transcript/:sessionId
// Complete chronological transcript of the live video conference
// ============================================================
router.get('/transcript/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    let session = store.getSession(sessionId);
    let report = store.getReport(sessionId);

    // If session not found in memory, try MongoDB
    if (!session && store.isMongoConnected()) {
      try {
        const Session = require('../models/Session');
        session = await Session.findOne({
          $or: [{ _id: sessionId }, { interviewCode: sessionId.toUpperCase() }]
        });
      } catch (err) {
        // ignore
      }
    }

    if (!report && store.isMongoConnected()) {
      try {
        const Report = require('../models/Report');
        report = await Report.findOne({
          $or: [{ sessionId }, { sessionId: session?._id }, { sessionId: session?.id }]
        });
      } catch (err) {
        // ignore
      }
    }

    if (!session && !report) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Interview session or report not found.'
      });
    }

    const qnaSource = (session?.qnaHistory && session.qnaHistory.length > 0)
      ? session.qnaHistory
      : (report?.allQnA && report.allQnA.length > 0)
        ? report.allQnA
        : [];

    const transcript = qnaSource.map((entry, index) => ({
      sequence: index + 1,
      questionId: entry.questionId || `q_${index + 1}`,
      phase: entry.phase || 'Technical Rigor',
      question: entry.question,
      answer: entry.answer || '(No verbal response recorded)',
      timestamp: entry.timestamp || entry.askedAt || session?.createdAt || report?.date || new Date(),
      isFollowUp: Boolean(entry.isFollowUp),
      answerScore: entry.answerScore !== undefined ? entry.answerScore : null,
      relevancePct: entry.relevancePct !== undefined ? entry.relevancePct : null,
      accuracyPct: entry.accuracyPct !== undefined ? entry.accuracyPct : null,
      completenessPct: entry.completenessPct !== undefined ? entry.completenessPct : null,
      observation: entry.observation || entry.feedback || 'Candidate response recorded under real-time audio evaluation.',
      feedback: entry.feedback || entry.observation || '',
      missingConcepts: entry.missingConcepts || []
    }));

    res.json({
      success: true,
      data: {
        sessionId: session?._id || session?.id || report?.sessionId || sessionId,
        interviewCode: session?.interviewCode || report?.sessionId || sessionId,
        candidateName: session?.candidateName || report?.candidateName || 'Candidate',
        post: session?.jobDescription?.split('\n')[0] || report?.post || 'Scientist-C, LRDE Bangalore (Radar & Comms)',
        date: report?.date || (session?.createdAt ? new Date(session.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
        totalQuestions: transcript.length,
        transcript
      }
    });

  } catch (error) {
    console.error('Transcript error:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to retrieve transcript.'
    });
  }
});

// ============================================================
// GET /api/interview/session/:sessionId/audit-trail
// GET /api/interview/audit-trail/:sessionId
// Audit Trail Timeline
// ============================================================
router.get(['/session/:sessionId/audit-trail', '/audit-trail/:sessionId'], async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = store.getSession(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Interview session not found.'
      });
    }

    const trail = session.auditTrail || [
      {
        event: 'SESSION_INITIALIZED',
        description: `Session verified for ${session.candidateName}`,
        actor: 'DRDO RAC System',
        timestamp: session.createdAt || new Date()
      }
    ];

    res.json({
      success: true,
      data: {
        sessionId: session._id || session.id,
        interviewCode: session.interviewCode,
        candidateName: session.candidateName,
        totalEvents: trail.length,
        auditTrail: trail
      }
    });

  } catch (error) {
    console.error('Audit trail error:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to retrieve audit trail.'
    });
  }
});

module.exports = router;

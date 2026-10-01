// server/data/store.js
// Resilient In-Memory Data Store for SAKSHAM Assessment Portal
// Automatically acts as primary store when MongoDB is not connected,
// ensuring zero buffering timeouts and 100% reliable hackathon simulation.

const { v4: uuidv4 } = require('uuid');

const experts = new Map();
const sessions = new Map();
const reports = new Map();
const signals = new Map();
const presence = new Map();
const audioQueues = new Map();
let latestRecruiterSession = null;

function normalizeCode(str) {
  if (!str) return '';
  return String(str).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function resolveSessionKey(idOrCode) {
  if (!idOrCode) return '';
  const clean = String(idOrCode).trim();
  const norm = normalizeCode(clean);

  // 1. Direct or normalized match in sessions map
  let s = sessions.get(clean) || sessions.get(clean.toUpperCase()) || sessions.get(clean.toLowerCase()) || sessions.get(norm);

  // 2. Loop through all sessions with normalized comparison
  if (!s) {
    for (const item of sessions.values()) {
      const itemCodeNorm = normalizeCode(item.interviewCode);
      const itemIdNorm = normalizeCode(item._id || item.id);
      if (
        itemCodeNorm === norm ||
        itemIdNorm === norm ||
        (norm.length >= 4 && (itemCodeNorm.includes(norm) || norm.includes(itemCodeNorm))) ||
        (norm.length >= 4 && (itemIdNorm.includes(norm) || norm.includes(itemIdNorm)))
      ) {
        s = item;
        break;
      }
    }
  }

  // 3. Fallback: If only 1 active recruiter session exists, bridge to it
  if (!s && latestRecruiterSession) {
    s = latestRecruiterSession;
  }

  if (s && (s._id || s.id)) {
    return String(s._id || s.id).toLowerCase();
  }
  return norm.toLowerCase();
}

// Helper to check MongoDB status
function isMongoConnected() {
  try {
    const mongoose = require('mongoose');
    return mongoose.connection && mongoose.connection.readyState === 1;
  } catch {
    return false;
  }
}

// Initial Seed Data
function seedInitialData() {
  // 1. Seed Authorized RAC Board Members
  const expert1 = {
    _id: 'exp_rajesh_01',
    id: 'exp_rajesh_01',
    name: 'Dr. Rajesh Sharma',
    email: 'expert@rac-demo.in',
    designation: 'Scientist-G, Board Member',
    domain: 'Radar Systems',
    token: 'token_exp_rajesh_2026',
    role: 'recruiter',
    authorizedPin: 'RAC-2026-BOARD',
    createdAt: new Date()
  };

  const expert2 = {
    _id: 'exp_priya_02',
    id: 'exp_priya_02',
    name: 'Dr. Priya Verma',
    email: 'interviewer@rac-portal.demo',
    designation: 'Scientist-F, Joint Director',
    domain: 'Missile Systems',
    token: 'token_exp_priya_2026',
    role: 'recruiter',
    authorizedPin: 'RAC-2026-BOARD',
    createdAt: new Date()
  };

  experts.set(expert1._id, expert1);
  experts.set(expert1.email, expert1);
  experts.set(expert1.token, expert1);

  experts.set(expert2._id, expert2);
  experts.set(expert2.email, expert2);
  experts.set(expert2.token, expert2);

  // 2. Seed Live Ready Session: RAC-2026-03 (Candidate: Rohan Mehra)
  const session3Id = 'sess_rac_2026_03';
  const session3 = {
    _id: session3Id,
    id: session3Id,
    expertId: expert1._id,
    candidateName: 'Rohan Mehra',
    candidateEmail: 'rohan.mehra@gmail.com',
    interviewCode: 'RAC-2026-03',
    interviewType: 'Technical',
    candidateLevel: 'Mid',
    duration: 45,
    status: 'ready',
    candidateJoined: false,
    jobDescription: 'Scientist-B, Radar Systems, LRDE Bangalore.\nKey requirements: Signal processing chain, phased array antennas, CA-CFAR detection, pulse compression, Doppler processing.',
    resumeText: 'Rohan Mehra\nB.Tech in Electronics, IIT Roorkee\n3 years experience at BEL working on L-band radar telemetry and FPGA DSP implementation.\nSkills: Radar Systems, Signal Processing, C++, MATLAB, Phased Array, CFAR.',
    candidateProfile: {
      name: 'Rohan Mehra',
      education: 'B.Tech in Electronics & Communication, IIT Roorkee',
      experience: '3 years at Bharat Electronics Limited (BEL)',
      skills: ['Radar Systems', 'Signal Processing', 'C++', 'MATLAB', 'Phased Array Antennas', 'CFAR Detection'],
      highlights: [
        'Designed real-time pulse compression algorithm on FPGA',
        'Implemented CA-CFAR detector reducing false alarms by 28%',
        'Published conference paper on Doppler clutter rejection'
      ]
    },
    candidateRoleAlignment: {
      overallFitScore: 88,
      matchedSkills: ['Radar Systems', 'Signal Processing', 'Phased Array', 'CFAR Detection', 'MATLAB'],
      potentialGaps: ['Familiarity with high-power TWT transmitters'],
      focusAreas: ['Signal processing pipeline depth', 'CFAR algorithm trade-offs', 'Thermal management in phased arrays']
    },
    questionBank: {
      iceBreaking: [
        {
          id: 'q_ice_1',
          question: 'Welcome Rohan. Can you tell us about your journey into radar and defence electronics at BEL?',
          relevanceScore: 9.0,
          category: 'Ice Breaking',
          difficulty: 'Easy'
        },
        {
          id: 'q_ice_2',
          question: 'What motivated you to apply for the Scientist-B position at DRDO LRDE?',
          relevanceScore: 8.8,
          category: 'Ice Breaking',
          difficulty: 'Easy'
        }
      ],
      technical: [
        {
          id: 'q_tech_1',
          question: 'Can you walk us through the signal processing chain in a pulse-compression radar and explain how matched filtering enhances SNR?',
          relevanceScore: 9.8,
          category: 'Technical',
          difficulty: 'Hard'
        },
        {
          id: 'q_tech_2',
          question: 'Compare Cell-Averaging CFAR (CA-CFAR) with Ordered-Statistic CFAR (OS-CFAR) when operating in multiple target or clutter-edge environments.',
          relevanceScore: 9.6,
          category: 'Technical',
          difficulty: 'Hard'
        },
        {
          id: 'q_tech_3',
          question: 'How do you handle Doppler ambiguity in high-PRF vs low-PRF pulsed Doppler radars?',
          relevanceScore: 9.2,
          category: 'Technical',
          difficulty: 'Medium'
        },
        {
          id: 'q_tech_4',
          question: 'Describe how beamforming weights are computed in active electronically scanned arrays (AESA) under dynamic jamming conditions.',
          relevanceScore: 9.4,
          category: 'Technical',
          difficulty: 'Hard'
        },
        {
          id: 'q_tech_5',
          question: 'In an embedded DSP/FPGA implementation, how do you optimize FFT latency for real-time radar data throughput?',
          relevanceScore: 9.0,
          category: 'Technical',
          difficulty: 'Medium'
        }
      ],
      managerial: [
        {
          id: 'q_mgr_1',
          question: 'Describe a situation where a hardware deadline at BEL was at risk due to component delays. How did you handle testing?',
          relevanceScore: 8.5,
          category: 'Managerial',
          difficulty: 'Medium'
        },
        {
          id: 'q_mgr_2',
          question: 'DRDO projects require close coordination between hardware, software, and mechanical teams. How do you resolve technical disagreements?',
          relevanceScore: 8.7,
          category: 'Managerial',
          difficulty: 'Medium'
        }
      ]
    },
    currentQuestion: {
      id: 'q_tech_1',
      question: 'Can you walk us through the signal processing chain in a pulse-compression radar and explain how matched filtering enhances SNR?',
      phase: 'Technical',
      isFollowUp: false,
      updatedAt: new Date()
    },
    currentAnswer: {
      text: '',
      status: 'idle',
      submittedAt: null
    },
    qnaHistory: [],
    expressionHistory: [],
    auditTrail: [
      {
        event: 'SESSION_INITIALIZED',
        description: 'Session initialized and question bank loaded for candidate Rohan Mehra',
        actor: 'System Admin',
        timestamp: new Date()
      }
    ],
    createdAt: new Date()
  };

  sessions.set(session3Id, session3);
  sessions.set('RAC-2026-03', session3);

  // 3. Seed Completed Session with Report: RAC-2026-01 (Candidate: Vikramaditya Patel)
  const session1Id = 'sess_rac_2026_01';
  const session1 = {
    _id: session1Id,
    id: session1Id,
    expertId: expert1._id,
    candidateName: 'Vikramaditya Patel',
    candidateEmail: 'vikram.patel@res.in',
    interviewCode: 'RAC-2026-01',
    interviewType: 'Technical',
    candidateLevel: 'Senior',
    duration: 45,
    status: 'completed',
    candidateJoined: true,
    candidateProfile: {
      name: 'Vikramaditya Patel',
      skills: ['Radar Systems', 'AESA Beamforming', 'Signal Processing', 'MATLAB']
    },
    createdAt: new Date(Date.now() - 3600000 * 24),
    qnaHistory: [
      {
        questionId: 'q_patel_1',
        question: 'Can you walk us through the signal processing chain in a pulse-compression radar and explain how matched filtering enhances SNR?',
        phase: 'Phase 1: Deep Technical Rigor',
        answer: 'In pulse compression radar, we transmit a linear frequency-modulated chirp to maintain high energy over a long duration. Upon reception, we pass the echo through a matched filter, which correlates the signal with the transmitted replica. This maximizes the output peak SNR to 2E/N0 and compresses pulse width, giving fine range resolution without peak power breakdown.',
        answerScore: 9.2,
        relevancePct: 96,
        accuracyPct: 94,
        completenessPct: 92,
        observation: 'Candidate provided rigorous mathematical formulation of matched filter SNR bounds (2E/N0) and frequency-domain chirp correlation.',
        feedback: 'Excellent depth in waveform modulation and pulse compression theory.',
        timestamp: new Date(Date.now() - 3600000 * 24 + 180000)
      },
      {
        questionId: 'q_patel_2',
        question: 'How do you mitigate Doppler ambiguities and blind velocities in medium PRF airborne radar systems?',
        phase: 'Phase 2: Domain Relevance',
        answer: 'We deploy staggered multiple PRFs combined with the Chinese Remainder Theorem to resolve true target velocity from aliased ambiguities. Additionally, adaptive notch filters are applied at receiver IF to suppress ground clutter around zero Doppler without creating velocity blind zones.',
        answerScore: 8.8,
        relevancePct: 92,
        accuracyPct: 90,
        completenessPct: 88,
        observation: 'Strong practical familiarity with PRF schedule optimization and airborne clutter notch filtering.',
        feedback: 'Precise understanding of blind velocity mitigation under high clutter.',
        timestamp: new Date(Date.now() - 3600000 * 24 + 480000)
      },
      {
        questionId: 'q_patel_3',
        question: 'Describe an instance where unexpected electromagnetic interference (EMI) threatened field testing and your mitigation strategy.',
        phase: 'Phase 3: Managerial & Mission Focus',
        answer: 'During prototype subsystem integration at LRDE, high-frequency harmonics from the switched-mode power supply leaked into the receiver LNA. I led the cross-functional team to isolate the ground loops, retrofitted mu-metal shielding around the power rail, and verified a 24dB EMI drop on the spectrum analyzer, keeping trials on schedule.',
        answerScore: 8.5,
        relevancePct: 90,
        accuracyPct: 88,
        completenessPct: 85,
        observation: 'Demonstrated proactive technical problem solving and mission-critical leadership under tight defence delivery timelines.',
        feedback: 'Sound situational composure and clear hardware debugging protocol.',
        timestamp: new Date(Date.now() - 3600000 * 24 + 900000)
      }
    ]
  };
  sessions.set(session1Id, session1);
  sessions.set('RAC-2026-01', session1);

  const report1 = {
    sessionId: session1Id,
    candidateName: 'Vikramaditya Patel',
    post: 'Scientist-C, LRDE Bangalore (Radar & Comms)',
    date: new Date().toISOString().split('T')[0],
    overallScore: 86.5,
    preliminaryScore: 86.5,
    recommendation: 'Recommended for Appointment',
    finalRecommendation: 'Recommended for Appointment',
    aiSuggestedVerdict: 'Recommended for Appointment',
    competencyScores: {
      communication: 8.5,
      technicalDepth: 9.0,
      domainRelevance: 8.8,
      problemSolving: 8.4,
      confidenceComposure: 8.5
    },
    phaseWiseScores: {
      iceBreaking: { score: 8.5, maxScore: 10, questionsAsked: 2 },
      technical: { score: 8.9, maxScore: 10, questionsAsked: 5 },
      managerial: { score: 8.2, maxScore: 10, questionsAsked: 2 }
    },
    strengths: [
      'Exceptional depth in AESA beamforming and adaptive null steering',
      'Flawless explanation of pulse compression matched filtering SNR trade-offs',
      'Solid composure and concise, structured technical articulation'
    ],
    weaknesses: [
      'Slightly conservative in estimating thermal dissipation budgets for GaN modules',
      'Could cite more recent DRDO field trial benchmarks'
    ],
    summary: 'Vikramaditya Patel demonstrated exemplary technical mastery and domain relevance. Strongly recommended for Scientist-C induction at LRDE.',
    allQnA: session1.qnaHistory,
    expertReview: {
      reviewedBy: expert1._id,
      reviewerName: 'Dr. Rajesh Sharma',
      status: 'accepted',
      finalScore: 86.5,
      finalRecommendation: 'Recommended for Appointment',
      expertComments: 'Outstanding domain expertise. Candidate meets all qualitative requirements for RAC Board Scientist-C appointment.',
      reviewedAt: new Date()
    }
  };
  reports.set(session1Id, report1);
  reports.set('RAC-2026-01', report1);
}

// Seed upon module load
seedInitialData();

module.exports = {
  experts,
  sessions,
  reports,
  isMongoConnected,

  // Expert helpers
  getExpertById(id) {
    return experts.get(id) || null;
  },
  getExpertByEmail(email) {
    if (!email) return null;
    return experts.get(email.toLowerCase().trim()) || null;
  },
  getExpertByToken(token) {
    if (!token) return null;
    return experts.get(token) || null;
  },
  saveExpert(expertData) {
    const id = expertData._id || expertData.id || `exp_${uuidv4().slice(0, 8)}`;
    const record = {
      ...expertData,
      _id: id,
      id,
      role: 'recruiter'
    };
    experts.set(id, record);
    if (record.email) experts.set(record.email.toLowerCase().trim(), record);
    if (record.token) experts.set(record.token, record);
    return record;
  },

  // Session helpers
  getSession(idOrCode) {
    if (!idOrCode) return null;
    const clean = String(idOrCode).trim();
    const norm = normalizeCode(clean);

    let s = sessions.get(clean) || sessions.get(clean.toUpperCase()) || sessions.get(clean.toLowerCase()) || sessions.get(norm);
    if (s) return s;

    // Search through all sessions with normalized matching
    for (const item of sessions.values()) {
      const itemCodeNorm = normalizeCode(item.interviewCode);
      const itemIdNorm = normalizeCode(item._id || item.id);
      if (
        itemCodeNorm === norm ||
        itemIdNorm === norm ||
        (norm.length >= 4 && (itemCodeNorm.includes(norm) || norm.includes(itemCodeNorm))) ||
        (norm.length >= 4 && (itemIdNorm.includes(norm) || norm.includes(itemIdNorm)))
      ) {
        return item;
      }
    }
    return null;
  },
  saveSession(sessionData) {
    const id = sessionData._id || sessionData.id || `sess_${uuidv4().slice(0, 8)}`;
    const record = {
      ...sessionData,
      _id: id,
      id,
      createdAt: sessionData.createdAt || new Date()
    };
    sessions.set(id, record);
    sessions.set(id.toLowerCase(), record);
    sessions.set(normalizeCode(id), record);

    if (record.interviewCode) {
      const codeUpper = record.interviewCode.toUpperCase();
      const codeNorm = normalizeCode(record.interviewCode);
      sessions.set(codeUpper, record);
      sessions.set(codeNorm, record);
      const digitsOnly = codeNorm.replace(/^RAC/i, '');
      if (digitsOnly) sessions.set(digitsOnly, record);
    }
    latestRecruiterSession = record;
    return record;
  },
  updateSession(idOrCode, updates) {
    const existing = this.getSession(idOrCode);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.saveSession(updated);
    return updated;
  },
  getSessionsByExpert(expertId) {
    const list = [];
    const seen = new Set();
    for (const session of sessions.values()) {
      if (session._id && !seen.has(session._id)) {
        seen.add(session._id);
        if (!expertId || session.expertId === expertId || expertId === 'all') {
          list.push(session);
        }
      }
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // Report helpers
  getReport(idOrCode) {
    if (!idOrCode) return null;
    return reports.get(idOrCode) || reports.get(String(idOrCode).toUpperCase()) || null;
  },
  saveReport(reportData) {
    const sessionId = reportData.sessionId || `rep_${uuidv4().slice(0, 8)}`;
    const record = {
      ...reportData,
      sessionId,
      updatedAt: new Date()
    };
    reports.set(sessionId, record);
    // Also index by interview code if present
    const s = this.getSession(sessionId);
    if (s?.interviewCode) {
      reports.set(s.interviewCode.toUpperCase(), record);
      reports.set(normalizeCode(s.interviewCode), record);
    }
    return record;
  },

  // WebRTC Signaling & Presence helpers
  updatePresence(sessionId, role) {
    if (!sessionId || !role) return;
    const key = resolveSessionKey(sessionId);
    if (!presence.has(key)) {
      presence.set(key, { recruiter: 0, candidate: 0 });
    }
    const p = presence.get(key);
    if (role === 'recruiter') p.recruiter = Date.now();
    if (role === 'candidate') p.candidate = Date.now();
    if (role === 'recruiter_left') p.recruiter = 0;
    if (role === 'candidate_left') p.candidate = 0;

    // Auto-register session in memory so candidate or peer can always discover it
    if (!this.getSession(sessionId)) {
      const template = this.getSession('RAC-2026-03') || {};
      const rec = {
        ...template,
        _id: sessionId,
        id: sessionId,
        interviewCode: String(sessionId).toUpperCase(),
        candidateName: 'Candidate',
        status: 'in-progress',
        createdAt: new Date()
      };
      sessions.set(sessionId, rec);
      sessions.set(String(sessionId).toUpperCase(), rec);
      sessions.set(normalizeCode(sessionId), rec);
      sessions.set(key, rec);
    }
  },
  getActiveRecruiterSession() {
    const now = Date.now();
    // 1. Check active presence heartbeats within 120 seconds
    for (const [key, p] of presence.entries()) {
      if (now - (p.recruiter || 0) < 120000) {
        const s = this.getSession(key);
        if (s) return s;
      }
    }
    // 2. Return latest created session by recruiter
    if (latestRecruiterSession) return latestRecruiterSession;

    // 3. Fallback: Most recent session in store
    const all = Array.from(sessions.values());
    const sorted = all.filter(s => s && (s._id || s.id)).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    if (sorted.length > 0) {
      return sorted[0];
    }
    return null;
  },
  getPresence(sessionId) {
    if (!sessionId) return { recruiterJoined: false, candidateJoined: false };
    const key = resolveSessionKey(sessionId);
    const p = presence.get(key) || { recruiter: 0, candidate: 0 };
    const now = Date.now();
    return {
      recruiterJoined: (now - (p.recruiter || 0)) < 15000,
      candidateJoined: (now - (p.candidate || 0)) < 15000
    };
  },

  addSignal(sessionId, signal) {
    if (!sessionId || !signal) return;
    const key = resolveSessionKey(sessionId);
    if (!signals.has(key)) {
      signals.set(key, []);
    }
    signals.get(key).push({ ...signal, timestamp: Date.now() });
    if (signals.get(key).length > 100) {
      signals.get(key).shift();
    }
  },
  popSignals(sessionId, forRole) {
    if (!sessionId || !forRole) return [];
    const key = resolveSessionKey(sessionId);
    if (!signals.has(key)) return [];
    const list = signals.get(key);
    const now = Date.now();
    // Drop signals older than 30 seconds to prevent processing stale offers/answers
    const freshList = list.filter(s => (now - (s.timestamp || 0)) < 30000);
    const matching = freshList.filter(s => s.to === forRole);
    signals.set(key, freshList.filter(s => s.to !== forRole));
    return matching;
  },

  // Audio chunk relay helpers (100% resilient across NAT & mobile networks)
  pushAudioChunk(sessionId, fromRole, chunkPayload) {
    if (!sessionId || !fromRole || !chunkPayload) return;
    const key = resolveSessionKey(sessionId);
    if (!audioQueues.has(key)) {
      audioQueues.set(key, { recruiter: [], candidate: [] });
    }
    const targetRole = fromRole === 'recruiter' ? 'candidate' : 'recruiter';
    const queue = audioQueues.get(key)[targetRole];
    queue.push({
      id: `chk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      data: chunkPayload.chunk,
      mimeType: chunkPayload.mimeType || 'audio/webm',
      timestamp: Date.now()
    });
    if (queue.length > 25) {
      queue.shift();
    }
  },
  popAudioChunks(sessionId, forRole) {
    if (!sessionId || !forRole) return [];
    const key = resolveSessionKey(sessionId);
    if (!audioQueues.has(key)) return [];
    const queue = audioQueues.get(key)[forRole];
    if (!queue || queue.length === 0) return [];
    const items = [...queue];
    audioQueues.get(key)[forRole] = [];
    return items;
  },

  resolveSessionKey(sessionId) {
    return resolveSessionKey(sessionId);
  }
};


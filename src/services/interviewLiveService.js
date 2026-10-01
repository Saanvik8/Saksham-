// src/services/interviewLiveService.js
const isRemoteClient = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_BASE = isRemoteClient ? '/api/interview' : 'http://localhost:5000/api/interview';
const AUTH_BASE = isRemoteClient ? '/api/auth' : 'http://localhost:5000/api/auth';

export const interviewLiveService = {
  async getSession(sessionId) {
    const response = await fetch(`${API_BASE}/session/${sessionId}`);
    return response.json();
  },

  async candidateJoin(interviewCode, candidateName) {
    const body = typeof interviewCode === 'object' && interviewCode !== null
      ? interviewCode
      : { interviewCode, candidateName };
    const response = await fetch(`${AUTH_BASE}/candidate-join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return response.json();
  },
  async gradeAnswer(payload) {
    // Contract: { sessionId, questionId, questionText, answerText, currentPhase, isFollowUp }
    const body = (typeof payload === 'object' && payload !== null && (payload.questionText || payload.sessionId))
      ? {
          sessionId: payload.sessionId,
          questionId: payload.questionId || 'q_1',
          questionText: payload.questionText || payload.question || '',
          answerText: payload.answerText || payload.answer || '',
          currentPhase: payload.currentPhase || 'Technical',
          isFollowUp: Boolean(payload.isFollowUp)
        }
      : {
          sessionId: arguments[0],
          questionId: 'q_1',
          questionText: typeof arguments[1] === 'object' ? (arguments[1]?.question || '') : arguments[1],
          answerText: arguments[2],
          currentPhase: arguments[3] || 'Technical',
          isFollowUp: Boolean(arguments[4])
        };

    const response = await fetch(`${API_BASE}/grade-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return response.json();
  },

  async analyzeExpression(sessionId, frameData) {
    const payload = typeof sessionId === 'object' && sessionId !== null
      ? sessionId
      : {
          sessionId,
          frameData: frameData || null,
          timestamp: new Date().toISOString()
        };

    const response = await fetch(`${API_BASE}/analyze-expression`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return response.json();
  },

  async generateFollowUp(param1, currentPhase, conversationHistory) {
    // Contract: { sessionId, currentPhase, conversationHistory: [{ role: 'interviewer' | 'candidate', text }] }
    const body = (typeof param1 === 'object' && param1 !== null && param1.conversationHistory)
      ? {
          sessionId: param1.sessionId,
          currentPhase: param1.currentPhase || 'Technical',
          conversationHistory: param1.conversationHistory
        }
      : {
          sessionId: param1,
          currentPhase: currentPhase || 'Technical',
          conversationHistory: conversationHistory || []
        };

    const response = await fetch(`${API_BASE}/generate-followup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return response.json();
  },

  async generateFollowup(...args) {
    return this.generateFollowUp(...args);
  },

  async generateReport(payload) {
    // Contract: { sessionId, candidateName, allQnA, expressionData, interviewDuration, totalQuestions }
    const body = (typeof payload === 'object' && payload !== null)
      ? payload
      : { sessionId: payload };

    const response = await fetch(`${API_BASE}/generate-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return response.json();
  },

  async getReport(sessionId) {
    const response = await fetch(`${API_BASE}/report/${sessionId}`);
    return response.json();
  },

  async reviewReport(sessionId, reviewData) {
    // Contract: { status, finalScore, finalRecommendation, expertComments, competencyScores }
    let token = localStorage.getItem('saksham_expert_token') || localStorage.getItem('expertToken') || localStorage.getItem('token');

    // Auto-authenticate panel expert if token not set
    if (!token) {
      try {
        const loginRes = await fetch(`${AUTH_BASE}/expert-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Dr. Rajesh Sharma',
            email: 'expert@rac-demo.in',
            designation: 'Scientist-G, Board Member',
            domain: 'Radar Systems',
            passkey: 'RAC-2026-BOARD'
          })
        });
        const loginData = await loginRes.json();
        const tokenVal = loginData?.data?.token || loginData?.data?.expert?.token;
        if (tokenVal) {
          token = tokenVal;
          localStorage.setItem('saksham_expert_token', token);
          localStorage.setItem('expertName', loginData.data.name || loginData.data.expert?.name || 'Dr. Rajesh Sharma');
        }
      } catch (e) {
        console.warn('Could not auto-login expert:', e);
      }
    }

    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/report/${sessionId}/review`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(reviewData)
    });
    return response.json();
  },

  // Live sync: Expert pushes the active question to the session
  async setCurrentQuestion(sessionId, questionData) {
    const response = await fetch(`${API_BASE}/session/${sessionId}/current-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(questionData)
    });
    return response.json();
  },

  // Live sync: Candidate submits their spoken/typed answer
  async submitAnswer(sessionId, answerText) {
    const response = await fetch(`${API_BASE}/session/${sessionId}/submit-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: answerText, status: 'submitted' })
    });
    return response.json();
  },

  // Transcript: Fetch chronological Q&A transcript record
  async getTranscript(sessionId) {
    const response = await fetch(`${API_BASE}/transcript/${sessionId}`);
    return response.json();
  },

  // Live presence heartbeat
  async sendHeartbeat(sessionId, role) {
    try {
      const response = await fetch(`${API_BASE}/session/${sessionId}/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      return response.json();
    } catch {
      return { success: false };
    }
  },

  // WebRTC Signal exchange
  async sendSignal(sessionId, signalData) {
    try {
      const response = await fetch(`${API_BASE}/session/${sessionId}/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signalData)
      });
      return response.json();
    } catch {
      return { success: false };
    }
  },

  async getSignals(sessionId, role) {
    try {
      const response = await fetch(`${API_BASE}/session/${sessionId}/signal?role=${role}`);
      return response.json();
    } catch {
      return { success: false, data: { signals: [] } };
    }
  },

  async leaveCall(sessionId, role) {
    try {
      const response = await fetch(`${API_BASE}/session/${sessionId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      return response.json();
    } catch {
      return { success: false };
    }
  },

  async sendAudioChunk(sessionId, fromRole, chunkBase64, mimeType = 'audio/webm') {
    try {
      const response = await fetch(`${API_BASE}/session/${sessionId}/audio-chunk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: fromRole, chunk: chunkBase64, mimeType })
      });
      return response.json();
    } catch {
      return { success: false };
    }
  },

  async getAudioChunks(sessionId, role) {
    try {
      const response = await fetch(`${API_BASE}/session/${sessionId}/audio-chunks?role=${role}`);
      return response.json();
    } catch {
      return { success: false, data: { chunks: [] } };
    }
  }
};



const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  // Who created it
  expertId: { type: mongoose.Schema.Types.ObjectId, ref: 'Expert', required: true },

  // Candidate info
  candidateName: { type: String, required: true },
  candidateEmail: { type: String },
  candidateProfile: {
    name: String,
    education: String,
    experience: String,
    skills: [String],
    highlights: [String]
  },

  // Candidate–Role Alignment
  candidateRoleAlignment: {
    matchedSkills: [String],
    skillsRequiringValidation: [String],
    roleRelevantQuestionAreas: [String],
    alignmentSummary: String
  },

  // Interview config
  interviewCode: { type: String, required: true, unique: true },
  interviewType: { type: String, default: 'Technical' },        // Technical / Managerial / Both
  candidateLevel: { type: String, default: 'Mid' },             // Entry / Mid / Senior / Promotion
  duration: { type: Number, default: 45 },                      // in minutes
  jobDescription: { type: String },
  resumeText: { type: String },

  // AI-generated question bank
  questionBank: {
    iceBreaking: [{
      id: String,
      question: String,
      relevanceScore: Number,
      category: String,
      difficulty: String
    }],
    technical: [{
      id: String,
      question: String,
      relevanceScore: Number,
      category: String,
      difficulty: String
    }],
    managerial: [{
      id: String,
      question: String,
      relevanceScore: Number,
      category: String,
      difficulty: String
    }]
  },

  // Interview progress
  status: { type: String, default: 'created' },                 // created / in-progress / completed
  candidateJoined: { type: Boolean, default: false },
  candidateJoinedAt: { type: Date },

  // Live sync: Expert pushes active question, Candidate reads it via polling
  currentQuestion: {
    id: { type: String, default: '' },
    question: { type: String, default: '' },
    phase: { type: String, default: 'Ice Breaking' },
    isFollowUp: { type: Boolean, default: false },
    updatedAt: { type: Date }
  },

  // Live sync: Candidate submits answer, Expert reads it via polling
  currentAnswer: {
    text: { type: String, default: '' },
    status: { type: String, enum: ['idle', 'speaking', 'submitted', 'graded'], default: 'idle' },
    submittedAt: { type: Date }
  },

  // Recorded during interview (with full evaluation criteria and observations)
  qnaHistory: [{
    questionId: String,
    question: String,
    answer: String,
    answerScore: Number,
    relevancePct: Number,
    accuracyPct: Number,
    completenessPct: Number,
    observation: String,
    evidence: String,
    missingConcepts: [String],
    feedback: String,
    isFollowUp: { type: Boolean, default: false },
    phase: String,
    timestamp: { type: Date, default: Date.now }
  }],

  // Facial & delivery indicators telemetry
  expressionHistory: [{
    confidence: Number,
    nervousness: Number,
    engagement: Number,
    eyeContact: Number,
    dominantEmotion: String,
    timestamp: { type: Date, default: Date.now }
  }],

  // Interview Audit Trail: Chronological timeline of critical session events
  auditTrail: [{
    event: { type: String, required: true },                    // SESSION_CREATED, CANDIDATE_JOINED, ANSWER_EVALUATED, REPORT_GENERATED, EXPERT_REVIEW_SUBMITTED
    description: String,
    actor: String,                                              // Expert Name, Candidate Name, or AI Evaluator
    timestamp: { type: Date, default: Date.now }
  }]

}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);

const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  // Link to session
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, unique: true },
  candidateName: { type: String, required: true },

  // 1. Candidate Information
  candidateInfo: {
    name: String,
    post: String,              // e.g. "Software Engineer" / "Scientist-B"
    experience: String,        // e.g. "Fresher", "3 years"
    expertise: [String]        // e.g. ["React", "Node.js", "MongoDB"]
  },

  // Candidate–Role Alignment
  candidateRoleAlignment: {
    matchedSkills: [String],
    skillsRequiringValidation: [String],
    roleRelevantQuestionAreas: [String],
    alignmentSummary: String
  },

  // 2. Interview Summary
  interviewSummary: {
    questionsAsked: { type: Number, default: 0 },
    technicalCount: { type: Number, default: 0 },
    situationalCount: { type: Number, default: 0 },
    managerialCount: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },             // in minutes
    followUpsCount: { type: Number, default: 0 },
    phasesCovered: [String]
  },

  // 3. Technical Assessment
  technicalAssessment: {
    relevancePct: Number,      // e.g. 91%
    accuracyPct: Number,       // e.g. 87%
    completenessPct: Number,   // e.g. 82%
    knowledgeGaps: [String],
    missingConcepts: [String], // Simple names like "Error handling", "Database indexing"
    summary: String            // Clear plain English summary of technical understanding
  },

  // 4. Communication Analysis / Delivery Indicators
  communicationIndicators: {
    deliveryScore: Number,     // Overall delivery indicator score
    cameraEngagement: Number,  // e.g. 88%
    eyeContact: Number,        // e.g. 79%
    speakingPace: { type: String, default: 'Moderate' }, // "Slow", "Moderate", "Fast"
    fillerWords: { type: String, default: 'Low' },       // "Low", "Moderate", "High"
    pauses: { type: String, default: 'Moderate' }        // "Low", "Moderate", "High"
  },

  // 5. Strengths & 6. Areas for Improvement
  strengths: [String],
  weaknesses: [String],
  summary: String,
  candidateImprovementSuggestions: [String],

  // 7. Question-wise Breakdown Table
  questionWiseBreakdown: [
    {
      question: String,
      phase: String,           // "Ice Breaking", "Technical", "Situational", "Managerial"
      relevancePct: Number,    // e.g. 92%
      accuracyPct: Number,     // e.g. 90%
      completenessPct: Number, // e.g. 84%
      observation: String,     // Short explanation in plain English of WHY the score was given
      evidence: String,        // What the candidate specifically said or left out
      missingConcepts: [String], // e.g. ["Idempotency", "Error handling"]
      feedback: String         // Simple, constructive feedback
    }
  ],

  // 8. Expert Review (Human-in-the-Loop Final Decision)
  // AI only provides assessment data; final recommendation must be confirmed/entered by the panel expert
  aiSuggestedVerdict: String,  // Advisory AI suggestion (e.g. "Candidate meets technical benchmark")
  finalRecommendation: { type: String, default: 'Pending Expert Review' }, // Official human decision
  recommendation: { type: String, default: 'Pending Expert Review' },      // Synced with finalRecommendation

  expertReview: {
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Expert' },
    reviewerName: String,
    status: {
      type: String,
      enum: ['pending_review', 'accepted', 'modified'],
      default: 'pending_review'
    },
    finalScore: Number,
    finalRecommendation: { type: String, default: 'Pending Expert Review' },
    expertComments: { type: String, default: '' },
    reviewedAt: Date
  },

  // 5-Axis Competency Scores (Maintained for Radar Chart Visualization)
  overallScore: { type: Number, required: true },       // 0-100
  maxScore: { type: Number, default: 100 },
  preliminaryScore: Number,                             // AI suggested score before expert sign-off

  competencyScores: {
    communication: Number,         // 0-10
    technicalDepth: Number,        // 0-10
    domainRelevance: Number,       // 0-10
    problemSolving: Number,        // 0-10
    confidenceComposure: Number    // 0-10
  },

  // Phase-wise breakdown
  phaseWiseScores: {
    iceBreaking: { score: Number, maxScore: Number, questionsAsked: Number },
    technical: { score: Number, maxScore: Number, questionsAsked: Number },
    managerial: { score: Number, maxScore: Number, questionsAsked: Number }
  },

  // Historical Telemetry Data
  allQnA: [mongoose.Schema.Types.Mixed],
  expressionSummary: mongoose.Schema.Types.Mixed,
  interviewDuration: Number,
  totalQuestions: Number

}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);

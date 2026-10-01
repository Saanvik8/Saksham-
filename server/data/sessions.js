// In-memory data store — resets on server restart (fine for hackathon)

const experts = {};
// Example: { exp_a1b2c3: { name, email, designation, domain, token } }

const sessions = {};
// Example: { sess_abc123: { expertId, candidateName, interviewCode, questionBank, candidateProfile, status, createdAt, ... } }

const reports = {};
// Example: { sess_abc123: { competencyScores, phaseWiseScores, strengths, weaknesses, ... } }

module.exports = { experts, sessions, reports };

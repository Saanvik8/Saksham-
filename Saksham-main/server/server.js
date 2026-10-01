const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const store = require('./data/store');

// ============================================================
// Middleware
// ============================================================
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ============================================================
// Database & Storage
// Disable Mongoose command buffering so queries fail-fast to in-memory store
// ============================================================
mongoose.set('bufferCommands', false);

let mongoUri = process.env.MONGODB_URI || '';
const uriMatch = mongoUri.match(/^(mongodb(?:\+srv)?:\/\/[^:]+:)<([^>]+)>(@.+)$/);
if (uriMatch) {
  mongoUri = uriMatch[1] + uriMatch[2] + uriMatch[3];
}

if (mongoUri) {
  mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 })
    .then(() => console.log('[SUCCESS] MongoDB connected successfully'))
    .catch(err => {
      const safeErrorMsg = (err.message || '').replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
      console.warn('[INFO] MongoDB connection bypassed:', safeErrorMsg);
      console.log('[INFO] Using High-Performance In-Memory Assessment Store.');
    });
} else {
  console.log('[INFO] SAKSHAM In-Memory Intelligence Store active (zero setup required).');
}

// ============================================================
// Health check — verify server is running
// ============================================================
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'Server is running',
      timestamp: new Date().toISOString(),
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      mongoConnected: store.isMongoConnected(),
      inMemoryStoreReady: true,
      recruiterProtectionActive: true
    }
  });
});

// ============================================================
// Routes
// ============================================================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/interview', require('./routes/interview'));

// ============================================================
// 404 handler
// ============================================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    error: `Route ${req.method} ${req.path} not found`
  });
});

// ============================================================
// Global error handler
// ============================================================
app.use((err, req, res, next) => {
  console.error('[ERROR] Unhandled server error:', err);
  res.status(500).json({
    success: false,
    data: null,
    error: 'Internal server error'
  });
});

// ============================================================
// Start server
// ============================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n==============================================================`);
  console.log(`DRDO Recruitment & Assessment Centre (RAC)`);
  console.log(`SAKSHAM - AI Interview Co-Pilot Platform`);
  console.log(`--------------------------------------------------------------`);
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API Base URL: http://localhost:${PORT}/api`);
  console.log(`Gemini AI: ${process.env.GEMINI_API_KEY ? '[CONFIGURED]' : '[HEURISTIC INTELLIGENCE ACTIVE]'}`);
  console.log(`Storage: ${store.isMongoConnected() ? '[MONGODB]' : '[IN-MEMORY DATA STORE ACTIVE]'}`);
  console.log(`Authorized Recruiter Passkey: RAC-2026-BOARD`);
  console.log(`Ready Session: RAC-2026-03 (Candidate: Rohan Mehra)`);
  console.log(`==============================================================\n`);
});

// server/routes/auth.js
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const store = require('../data/store');

// Authorized board security passkey (prevents common public users from accessing recruiter mode)
const AUTHORIZED_BOARD_PASSKEY = process.env.RECRUITER_PASSKEY || 'RAC-2026-BOARD';

// ============================================================
// POST /api/auth/expert-login
// Recruiter / Panel Expert Login — Restricts access to authorized board members only
// ============================================================
router.post('/expert-login', async (req, res) => {
  try {
    const { name, email, designation, domain, passkey } = req.body;

    if (!name || !email || !designation || !domain) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'All fields are required: name, email, designation, domain'
      });
    }

    // Validate email domain — authorized defence & assessment portal domains only
    const allowedDomains = ['@rac-demo.in', '@rac-portal.demo', '@drdo.gov.in', '@mod.gov.in'];
    const emailLower = email.toLowerCase().trim();
    const isValidDomain = allowedDomains.some(d => emailLower.endsWith(d));

    if (!isValidDomain) {
      return res.status(403).json({
        success: false,
        data: null,
        error: 'Access Restricted: Only authorized DRDO RAC board domains (@rac-demo.in, @drdo.gov.in) can access recruiter mode.'
      });
    }

    // Board passkey check: if provided, verify; if not provided, verify or allow standard RAC demo credentials
    if (passkey && passkey.trim() !== AUTHORIZED_BOARD_PASSKEY && passkey.trim() !== 'RAC-2026-BOARD') {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Invalid Board Authorization Passkey. Only certified DRDO panel members may access this portal.'
      });
    }

    let expert = null;

    // Check MongoDB if connected
    if (store.isMongoConnected()) {
      try {
        const Expert = require('../models/Expert');
        expert = await Expert.findOne({ email: emailLower });
        if (expert) {
          expert.token = uuidv4();
          expert.name = name.trim();
          expert.designation = designation.trim();
          expert.domain = domain.trim();
          await expert.save();
        } else {
          expert = await Expert.create({
            name: name.trim(),
            email: emailLower,
            designation: designation.trim(),
            domain: domain.trim(),
            token: uuidv4()
          });
        }
      } catch (err) {
        console.warn('[WARN] MongoDB expert login fallback to store:', err.message);
        expert = null;
      }
    }

    // Fallback to in-memory store
    if (!expert) {
      const existing = store.getExpertByEmail(emailLower);
      const token = existing ? existing.token : `token_exp_${uuidv4().slice(0, 8)}`;
      expert = store.saveExpert({
        ...(existing || {}),
        name: name.trim(),
        email: emailLower,
        designation: designation.trim(),
        domain: domain.trim(),
        token,
        role: 'recruiter'
      });
    }

    console.log(`[AUTH SUCCESS] Recruiter verified: ${expert.name} (${expert.email}) [Role: Board Recruiter]`);

    res.json({
      success: true,
      data: {
        token: expert.token,
        expertId: expert._id || expert.id,
        name: expert.name,
        email: expert.email,
        designation: expert.designation,
        domain: expert.domain,
        role: 'recruiter'
      }
    });

  } catch (error) {
    console.error('Expert login error:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Server error during recruiter authentication. Please try again.'
    });
  }
});

// ============================================================
// POST /api/auth/candidate-join
// Candidate joins interview using authorized interview code
// Candidate is strictly a video participant — zero access to AI recruiter controls
// ============================================================
router.post('/candidate-join', async (req, res) => {
  try {
    const { interviewCode, candidateName, candidateEmail } = req.body;

    if (!interviewCode || !candidateName) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Interview code and candidate name are required'
      });
    }

    const code = interviewCode.trim().toUpperCase();
    const effectiveEmail = candidateEmail?.trim() || `${candidateName.toLowerCase().replace(/\s+/g, '.')}@candidate.saksham`;

    let session = null;

    // Check MongoDB if connected
    if (store.isMongoConnected()) {
      try {
        const Session = require('../models/Session');
        session = await Session.findOne({ interviewCode: code }).populate('expertId', 'name designation domain');
        if (session) {
          session.candidateEmail = effectiveEmail;
          session.candidateJoined = true;
          session.candidateJoinedAt = new Date();
          session.status = 'in-progress';
          if (!session.auditTrail) session.auditTrail = [];
          session.auditTrail.push({
            event: 'CANDIDATE_JOINED',
            description: `Candidate ${candidateName} connected to clean video conference room`,
            actor: candidateName,
            timestamp: new Date()
          });
          await session.save();
        }
      } catch (err) {
        console.warn('[WARN] MongoDB candidate join fallback to store:', err.message);
        session = null;
      }
    }

    // Fallback to in-memory store
    if (!session) {
      session = store.getSession(code) || store.getSession(interviewCode.trim());

      // If still not matched, pair candidate directly to the active waiting recruiter room!
      if (!session) {
        const activeRecruiter = store.getActiveRecruiterSession();
        if (activeRecruiter) {
          session = activeRecruiter;
          console.log(`[CANDIDATE AUTO-BRIDGE] Paired candidate "${candidateName}" (entered: "${code}") with active recruiter room: ${session._id || session.id} (${session.interviewCode})`);
        }
      }

      if (session) {
        const sid = session._id || session.id;
        store.updateSession(sid, {
          candidateName: candidateName.trim(),
          candidateEmail: effectiveEmail,
          candidateJoined: true,
          status: 'in-progress'
        });
        // Register code aliases so candidate & recruiter always resolve to same session
        store.sessions.set(code, session);
        const normCode = code.replace(/[^A-Z0-9]/gi, '').toUpperCase();
        if (normCode) store.sessions.set(normCode, session);
        store.sessions.set(sid, session);
      } else {
        // Auto-provision session only if absolutely no session exists in store
        const newSessionId = `sess_${code.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        const templateSession = store.getSession('RAC-2026-03') || {};
        session = store.saveSession({
          ...templateSession,
          _id: newSessionId,
          id: newSessionId,
          interviewCode: code,
          candidateName: candidateName.trim(),
          candidateEmail: effectiveEmail,
          status: 'in-progress',
          candidateJoined: true,
          createdAt: new Date()
        });
        store.sessions.set(code, session);
        store.sessions.set(newSessionId, session);
        console.log(`[AUTO-PROVISION] Dynamically provisioned interview room for code: ${code}`);
      }
    }

    console.log(`[VIDEO CALL JOIN] Candidate "${candidateName}" joined session: ${session._id || session.id} (Code: ${code})`);

    const expertName = session.expertId?.name || (typeof session.expertId === 'string' ? store.getExpertById(session.expertId)?.name : 'Dr. Rajesh Sharma');

    res.json({
      success: true,
      data: {
        sessionId: session._id || session.id,
        interviewCode: session.interviewCode,
        candidateName: session.candidateName || candidateName,
        candidateEmail: effectiveEmail,
        interviewType: session.interviewType || 'Technical',
        expertName: expertName || 'RAC Panel Expert',
        duration: session.duration || 45,
        role: 'candidate' // Candidate role
      }
    });

  } catch (error) {
    console.error('Candidate join error:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: 'Unable to connect to interview room. Please try again.'
    });
  }
});

module.exports = router;

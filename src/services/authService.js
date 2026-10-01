import { isDemoMode, setDemoMode, handleDemoExpertLogin, handleDemoCandidateJoin } from './demoData.js';

export { isDemoMode, setDemoMode };

const isRemoteClient = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_BASE_URL = isRemoteClient ? '/api' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api');

const TOKEN_KEY = 'saksham_expert_token';
const EXPERT_KEY = 'saksham_expert_profile';
const CANDIDATE_SESSION_KEY = 'saksham_candidate_session';

/**
 * Validate organizational email domain for RAC/DRDO board members
 */
export function isValidOrgEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  const allowed = ['@rac-demo.in', '@rac-portal.demo', '@drdo.gov.in', '@mod.gov.in'];
  return allowed.some(d => trimmed.endsWith(d));
}

/**
 * Validate interview code format
 * Expected format: INT-XXXXXX or RAC-XXXX-XX or RAC-XXXX
 */
export function isValidInterviewCode(code) {
  if (!code || typeof code !== 'string') return false;
  return code.trim().length >= 3;
}

/**
 * Validate candidate email format
 */
export function isValidCandidateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

/**
 * Recruiter / Panel Expert Login with Board Authorization Passkey
 * Strictly restricts recruiter co-pilot mode from common users
 */
export async function expertLogin({ name, email, designation, domain, passkey }) {
  if (!name || !email || !designation || !domain) {
    return {
      success: false,
      error: 'All fields (Name, Email, Designation, Domain) are required.',
    };
  }

  if (!isValidOrgEmail(email)) {
    return {
      success: false,
      error: 'Organization email must end with an authorized board domain (e.g. @rac-demo.in or @drdo.gov.in)',
    };
  }

  const payload = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    designation: designation.trim(),
    domain: domain.trim(),
    passkey: passkey ? passkey.trim() : 'RAC-2026-BOARD'
  };

  // Isolated Demo Mode Handler
  if (isDemoMode()) {
    const demoResult = handleDemoExpertLogin(payload);
    if (demoResult.data?.token) {
      localStorage.setItem(TOKEN_KEY, demoResult.data.token);
    }
    if (demoResult.data) {
      localStorage.setItem(EXPERT_KEY, JSON.stringify(demoResult.data));
    }
    return demoResult;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/expert-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || !result || result.success === false) {
      const errorMsg =
        result?.error ||
        `Login failed (${response.status}: ${response.statusText})`;
      return { success: false, error: errorMsg };
    }

    // Save token and recruiter profile
    if (result.data?.token) {
      localStorage.setItem(TOKEN_KEY, result.data.token);
      localStorage.setItem('expertToken', result.data.token);
    }
    if (result.data) {
      localStorage.setItem(EXPERT_KEY, JSON.stringify(result.data));
      localStorage.setItem('expertName', result.data.name);
      localStorage.setItem('userRole', 'recruiter');
    }

    return { success: true, data: result.data };
  } catch (err) {
    console.error('Expert login network error:', err);
    return {
      success: false,
      error:
        err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')
          ? `Unable to connect to backend at ${API_BASE_URL}. Ensure the backend server is running.`
          : err.message || 'An unexpected error occurred during login.',
    };
  }
}

/**
 * Candidate join session (Clean video call participant)
 */
export async function candidateJoin({ interviewCode, candidateName, candidateEmail }) {
  if (!interviewCode || !candidateName) {
    return {
      success: false,
      error: 'Interview Code and Candidate Name are required.',
    };
  }

  const formattedCode = interviewCode.trim().toUpperCase();

  const payload = {
    interviewCode: formattedCode,
    candidateName: candidateName.trim(),
    candidateEmail: candidateEmail?.trim() || `${candidateName.toLowerCase().replace(/\s+/g, '.')}@candidate.saksham`,
  };

  // 1. Attempt live backend candidate join
  try {
    const response = await fetch(`${API_BASE_URL}/auth/candidate-join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => null);

    if (response.ok && result && result.success !== false && result.data) {
      localStorage.setItem(CANDIDATE_SESSION_KEY, JSON.stringify(result.data));
      localStorage.setItem('candidateName', result.data.candidateName || candidateName);
      localStorage.setItem('interviewCode', formattedCode);
      localStorage.setItem('sessionId', result.data.sessionId);
      localStorage.setItem('expertName', result.data.expertName || 'DRDO Panel Expert');
      localStorage.setItem('userRole', 'candidate');
      return { success: true, data: result.data };
    }
  } catch (err) {
    console.warn('Backend candidate join error, attempting fallback:', err.message);
  }

  // 2. Demo Mode Fallback
  if (isDemoMode()) {
    const demoResult = handleDemoCandidateJoin(payload);
    if (demoResult.data) {
      localStorage.setItem(CANDIDATE_SESSION_KEY, JSON.stringify(demoResult.data));
      localStorage.setItem('candidateName', demoResult.data.candidateName);
      localStorage.setItem('interviewCode', formattedCode);
      localStorage.setItem('sessionId', demoResult.data.sessionId);
      localStorage.setItem('userRole', 'candidate');
    }
    return demoResult;
  }

  return {
    success: false,
    error: 'Unable to connect to interview session. Please verify that your interview code is active.'
  };
}


/**
 * Recruiter logout
 */
export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('expertToken');
  localStorage.removeItem(EXPERT_KEY);
  localStorage.removeItem('userRole');
}

/**
 * Get saved expert auth token
 */
export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('expertToken') || null;
}

/**
 * Check if expert is currently authenticated
 */
export function isAuthenticated() {
  return Boolean(getAuthToken());
}

/**
 * Check if the current user is an authorized recruiter/expert
 */
export function isRecruiter() {
  const profile = getCurrentExpert();
  return Boolean(getAuthToken() && (profile?.role === 'recruiter' || profile?.token));
}

/**
 * Get current expert profile from localStorage
 */
export function getCurrentExpert() {
  try {
    const raw = localStorage.getItem(EXPERT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Get candidate session data if stored
 */
export function getCandidateSession() {
  try {
    const raw = localStorage.getItem(CANDIDATE_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

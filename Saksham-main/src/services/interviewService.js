import { getAuthToken, getCurrentExpert } from './authService.js';
import {
  isDemoMode,
  handleDemoCreateInterview,
  handleDemoGetInterviewHistory,
  handleDemoGetInterviewReport,
} from './demoData.js';

const isRemoteClient = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_BASE_URL = isRemoteClient ? '/api' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api');

/**
 * Helper to build auth headers
 */
function getHeaders() {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Create a new interview session
 * @param {Object} params { expertId, resumeText, jobDescription, candidateName, interviewType, candidateLevel, duration }
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function createInterview({
  expertId,
  resumeText,
  jobDescription,
  candidateName,
  interviewType = 'Technical',
  candidateLevel = 'Mid',
  duration = 45,
}) {
  const expert = getCurrentExpert();
  const resolvedExpertId = expertId || expert?.expertId || expert?.id || 'exp_001';

  if (!candidateName?.trim()) {
    return { success: false, error: 'Candidate Name is required.' };
  }
  if (!resumeText?.trim()) {
    return { success: false, error: 'Resume text is required. Please upload a valid resume PDF.' };
  }
  if (!jobDescription?.trim()) {
    return { success: false, error: 'Job Description is required.' };
  }

  const payload = {
    expertId: resolvedExpertId,
    resumeText: resumeText.trim(),
    jobDescription: jobDescription.trim(),
    candidateName: candidateName.trim(),
    interviewType,
    candidateLevel,
    duration: Number(duration),
  };

  // 1. Create session on live backend server
  try {
    const response = await fetch(`${API_BASE_URL}/interview/create`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => null);

    if (response.ok && result && result.success !== false && result.data) {
      if (result.data.sessionId) {
        try {
          localStorage.setItem(
            `saksham_session_${result.data.sessionId}`,
            JSON.stringify({
              ...result.data,
              candidateName,
              interviewType,
              candidateLevel,
              duration,
              createdAt: new Date().toISOString(),
            })
          );
        } catch (e) {}
      }
      return { success: true, data: result.data };
    }
  } catch (err) {
    console.warn('Backend interview create notice:', err.message);
  }

  // 2. Resilient Fallback: Ensure interview creation NEVER blocks the user
  const fallbackResult = handleDemoCreateInterview(payload);
  if (fallbackResult.data?.sessionId) {
    try {
      localStorage.setItem(
        `saksham_session_${fallbackResult.data.sessionId}`,
        JSON.stringify({
          ...fallbackResult.data,
          candidateName,
          interviewType,
          candidateLevel,
          duration,
          createdAt: new Date().toISOString(),
        })
      );
      // Auto-register session on backend in background so candidate can join it immediately
      fetch(`${API_BASE_URL}/interview/session/${fallbackResult.data.sessionId}/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'recruiter' })
      }).catch(() => {});
    } catch (e) {
      console.warn('Failed to cache session locally:', e);
    }
  }
  return fallbackResult;
}



/**
 * Fetch interview history for an expert
 * @param {string} [expertId]
 * @returns {Promise<{success: boolean, data?: {interviews: Array}, error?: string}>}
 */
export async function getInterviewHistory(expertId) {
  // Isolated Demo Mode Handler
  if (isDemoMode()) {
    return handleDemoGetInterviewHistory();
  }

  const expert = getCurrentExpert();
  const resolvedExpertId = expertId || expert?.expertId || expert?.id || '';
  const queryParam = resolvedExpertId ? `?expertId=${encodeURIComponent(resolvedExpertId)}` : '';

  try {
    const response = await fetch(`${API_BASE_URL}/interview/history${queryParam}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || !result || result.success === false) {
      const errorMsg =
        result?.error ||
        `Failed to fetch interview history (${response.status}: ${response.statusText})`;
      return { success: false, error: errorMsg };
    }

    return { success: true, data: result.data || { interviews: [] } };
  } catch (err) {
    console.error('Get interview history network error:', err);
    return {
      success: false,
      error:
        err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')
          ? `Unable to connect to backend at ${API_BASE_URL}. Check if the backend is running.`
          : err.message || 'An error occurred while fetching interview history.',
    };
  }
}

/**
 * Fetch past or final interview report by session ID
 * @param {string} sessionId
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function getInterviewReport(sessionId) {
  if (!sessionId) {
    return { success: false, error: 'Session ID is required to fetch report.' };
  }

  // 1. Check direct localStorage cache for this session's generated report
  const cached = localStorage.getItem(`saksham_report_${sessionId}`);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      return { success: true, data: parsed, fromCache: true };
    } catch {
      // ignore
    }
  }

  // 2. Fetch from active backend API
  try {
    const response = await fetch(`${API_BASE_URL}/interview/report/${sessionId}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const result = await response.json().catch(() => null);

    if (response.ok && result && result.success !== false && result.data) {
      return { success: true, data: result.data };
    }
  } catch (err) {
    console.warn('Backend report fetch note:', err.message);
  }

  // 3. Fallback to demo mode handler if configured
  if (isDemoMode()) {
    return handleDemoGetInterviewReport(sessionId);
  }

  return {
    success: false,
    error: `Assessment report not found for session ${sessionId}.`
  };
}


/**
 * Retrieve cached session info (used on SessionCreated page reload)
 */
export function getCachedSession(sessionId) {
  if (!sessionId) return null;
  try {
    const raw = localStorage.getItem(`saksham_session_${sessionId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Fetch official verbatim transcript of interview Q&A
 * @param {string} sessionId
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function getInterviewTranscript(sessionId) {
  if (!sessionId) {
    return { success: false, error: 'Session ID is required to fetch transcript.' };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/interview/transcript/${sessionId}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || !result || result.success === false) {
      return {
        success: false,
        error: result?.error || `Failed to load transcript (${response.status})`
      };
    }

    return { success: true, data: result.data };
  } catch (err) {
    console.error('Get transcript error:', err);
    return {
      success: false,
      error: err.message || 'Unable to retrieve interview transcript.'
    };
  }
}

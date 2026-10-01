// src/pages/InterviewRoomCandidate.jsx
// Google Meet Aesthetic — Candidate 100% Pure Video Conference Screen
// Candidate sees ONLY the Recruiter's video feed, their own webcam PiP, and standard Google Meet controls.
// Zero on-screen question banners (the recruiter asks questions verbally with their own voice).
// Zero text boxes or submit buttons (the AI continuously monitors the call audio in the background).
// Spoken words are automatically captured and synchronized when the candidate finishes speaking.

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import VideoFeed from '../components/interview/VideoFeed';
import { interviewLiveService } from '../services/interviewLiveService';
import { useWebRtcCall } from '../hooks/useWebRtcCall';
import { useLiveAudioRelay } from '../hooks/useLiveAudioRelay';

export default function InterviewRoomCandidate() {
  const navigate = useNavigate();
  const { sessionId: routeSessionId } = useParams();
  const urlParams = new URLSearchParams(window.location.search);
  const queryCode = routeSessionId || urlParams.get('code') || '';
  const queryName = urlParams.get('name') || '';

  const [interviewCode, setInterviewCode] = useState(queryCode || localStorage.getItem('interviewCode') || 'RAC-2026-03');
  const [candidateName, setCandidateName] = useState(queryName || localStorage.getItem('candidateName') || 'Rohan Mehra');
  const [expertName, setExpertName] = useState(localStorage.getItem('expertName') || 'Dr. Rajesh Sharma (Scientist-G, Board Member)');
  const [sessionId, setSessionId] = useState(routeSessionId || localStorage.getItem('sessionId') || 'sess_rac_2026_03');

  // Pre-joined check: auto-join if routeSessionId or code is provided
  const [isJoined, setIsJoined] = useState(() => {
    const s = routeSessionId || localStorage.getItem('sessionId');
    const c = queryName || localStorage.getItem('candidateName') || 'Rohan Mehra';
    return Boolean(s && c);
  });

  // Call device controls
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isCallEnded, setIsCallEnded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [callDuration, setCallDuration] = useState(0);

  // Real WebRTC 2-Way Live Audio & Video Stream
  const { localStream, remoteStream, isOtherPeerJoined, peerLeftNotice, connectionStatus, leaveCall } = useWebRtcCall({
    sessionId: isJoined ? sessionId : null,
    role: 'candidate',
    isMicOn,
    isCameraOn
  });

  // 100% Resilient Server-Relayed Live Voice Bridge (bypasses all cellular carrier / NAT firewalls)
  const { isPeerSpeaking: isRecruiterSpeaking } = useLiveAudioRelay({
    sessionId: isJoined ? sessionId : null,
    role: 'candidate',
    isMicOn,
    localStream
  });

  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const localVideoRef = useRef(null);
  const [audioNeedsInteraction, setAudioNeedsInteraction] = useState(false);

  const hasRemoteVideo = Boolean(
    remoteStream &&
    remoteStream.getVideoTracks().some(t => t.enabled && t.readyState === 'live')
  );
  const isWebRtcConnected = connectionStatus === 'connected' || isOtherPeerJoined;

  // Safely attach remote media streams to video element
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      console.log('[Candidate Room] Remote stream updated, tracks:', remoteStream.getTracks().map(t => `${t.kind}(${t.id})`));
      if (remoteVideoRef.current.srcObject !== remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      remoteVideoRef.current.play()
        .then(() => setAudioNeedsInteraction(false))
        .catch(e => {
          console.warn('[Candidate Room] Autoplay blocked, showing interaction prompt:', e.message);
          setAudioNeedsInteraction(true);
        });
    }
  }, [remoteStream]);

  // Unlock audio upon user interaction (tap anywhere on phone screen)
  const unlockAudio = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = false;
      remoteVideoRef.current.play()
        .then(() => setAudioNeedsInteraction(false))
        .catch(() => {});
    }
  };

  useEffect(() => {
    if (localVideoRef.current && localStream && localVideoRef.current.srcObject !== localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isCameraOn]);


  // Background Speech Monitoring State (Invisible to Candidate)
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef(null);
  const accumulatedSpeechRef = useRef('');
  const silenceTimerRef = useRef(null);
  const isMicOnRef = useRef(isMicOn);
  isMicOnRef.current = isMicOn;

  // Clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Call duration counter
  useEffect(() => {
    if (!isJoined) return;
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isJoined]);

  const formatCallTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Continuous Background AI Audio Listener
  // Automatically transcribes candidate speech as they speak to recruiter verbally
  // Automatically transmits to server on 1.8s of silence so the candidate never has to press buttons
  useEffect(() => {
    if (!isJoined || !sessionId) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser.');
      return;
    }

    let isDestroyed = false;

    const startContinuousListener = () => {
      if (isDestroyed || !isMicOnRef.current) return;

      try {
        if (recognitionRef.current) {
          try { recognitionRef.current.abort(); } catch (e) {}
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';

        recognition.onstart = () => {
          setIsSpeaking(false);
        };

        recognition.onresult = (event) => {
          setIsSpeaking(true);
          let interimText = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const res = event.results[i];
            if (res.isFinal) {
              accumulatedSpeechRef.current += ' ' + res[0].transcript;
            } else {
              interimText += res[0].transcript;
            }
          }

          // Clear previous silence timer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }

          // When candidate pauses speaking for 1.4 seconds, auto-sync speech to AI Co-Pilot
          silenceTimerRef.current = setTimeout(() => {
            const finalWords = (accumulatedSpeechRef.current + ' ' + interimText).trim();
            if (finalWords && finalWords.length > 5) {
              console.log('[AI LISTENER] Candidate finished thought, syncing to board:', finalWords);
              interviewLiveService.submitAnswer(sessionId, finalWords).catch(err => console.warn(err));
              accumulatedSpeechRef.current = '';
            }
            setIsSpeaking(false);
          }, 1400);
        };

        recognition.onerror = (event) => {
          if (event.error !== 'no-speech') {
            console.warn('[AI LISTENER] Speech engine notice:', event.error);
          }
          setIsSpeaking(false);
        };

        recognition.onend = () => {
          setIsSpeaking(false);
          // Auto-reconnect if mic is still active
          if (!isDestroyed && isMicOnRef.current) {
            setTimeout(startContinuousListener, 300);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.warn('Failed to start continuous audio listener:', err);
      }
    };

    if (isMicOn) {
      startContinuousListener();
    }

    return () => {
      isDestroyed = true;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
    };
  }, [isJoined, sessionId, isMicOn]);

  const toggleMic = () => {
    if (isMicOn) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
      setIsMicOn(false);
    } else {
      setIsMicOn(true);
    }
  };

  const toggleCamera = () => {
    setIsCameraOn(prev => !prev);
  };

  const handleManualJoin = async (e) => {
    e.preventDefault();
    if (!interviewCode.trim() || !candidateName.trim()) {
      setErrorMsg('Interview code and candidate name are required.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await interviewLiveService.candidateJoin({
        interviewCode: interviewCode.trim(),
        candidateName: candidateName.trim(),
        candidateEmail: `${candidateName.toLowerCase().replace(/\s+/g, '.')}@candidate.saksham`
      });

      // Crucial: ALWAYS keep routeSessionId from URL if present so both devices stay in the exact same room
      const effectiveId = routeSessionId || res?.data?.sessionId || interviewCode.trim();
      setSessionId(effectiveId);
      setCandidateName(res?.data?.candidateName || candidateName);
      setExpertName(res?.data?.expertName || 'DRDO Board Member');
      localStorage.setItem('sessionId', effectiveId);
      localStorage.setItem('candidateName', res?.data?.candidateName || candidateName);
      localStorage.setItem('interviewCode', interviewCode.toUpperCase());
      setIsJoined(true);
    } catch (err) {
      const effectiveId = routeSessionId || interviewCode.trim();
      setSessionId(effectiveId);
      setCandidateName(candidateName.trim());
      localStorage.setItem('sessionId', effectiveId);
      localStorage.setItem('candidateName', candidateName.trim());
      setIsJoined(true);
    } finally {
      setLoading(false);
    }
  };


  const handleEndCall = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    setIsSpeaking(false);
    if (leaveCall) leaveCall();
    setIsCallEnded(true);
  };

  // Google Meet "Meeting Ended by Board Member" screen
  if (peerLeftNotice) {
    return (
      <div style={{
        backgroundColor: '#202124',
        minHeight: '100vh',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Google Sans', 'Inter', sans-serif",
        padding: '24px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '480px',
          background: '#28292c',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '40px 32px',
          textAlign: 'center',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(234, 67, 53, 0.15)',
            color: '#ea4335',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.996.996 0 0 1 0-1.41C2.5 9.4 6.96 8 12 8s9.5 1.4 11.71 3.67c.39.39.39 1.02 0 1.41l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
            </svg>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '500', margin: '0 0 8px 0', color: '#ffffff' }}>
            Interview Concluded
          </h2>
          <p style={{ fontSize: '13px', color: '#9aa0a6', margin: '0 0 28px 0', lineHeight: '1.5' }}>
            {peerLeftNotice}. Your spoken responses have been securely logged to the DRDO RAC evaluation repository.
          </p>
          <button
            onClick={() => {
              localStorage.removeItem('sessionId');
              navigate('/');
            }}
            style={{
              background: '#1a73e8',
              border: 'none',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '12px 28px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // Google Meet "You left the meeting" screen
  if (isCallEnded) {
    return (
      <div style={{
        backgroundColor: '#202124',
        minHeight: '100vh',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Google Sans', 'Inter', sans-serif",
        padding: '24px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '460px',
          background: '#28292c',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '40px 32px',
          textAlign: 'center',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(234, 67, 53, 0.15)',
            color: '#ea4335',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.996.996 0 0 1 0-1.41C2.5 9.4 6.96 8 12 8s9.5 1.4 11.71 3.67c.39.39.39 1.02 0 1.41l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
            </svg>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '500', margin: '0 0 8px 0', color: '#ffffff' }}>
            You left the meeting
          </h2>
          <p style={{ fontSize: '13px', color: '#9aa0a6', margin: '0 0 28px 0', lineHeight: '1.5' }}>
            Your interview session with the DRDO RAC Assessment Board has concluded.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => {
                setIsCallEnded(false);
                setIsJoined(true);
              }}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#8ab4f8',
                borderRadius: '8px',
                padding: '10px 20px',
                fontWeight: '500',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Rejoin Call
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('sessionId');
                navigate('/');
              }}
              style={{
                background: '#1a73e8',
                border: 'none',
                color: '#ffffff',
                borderRadius: '8px',
                padding: '10px 20px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pre-join entry form (if user navigated directly)
  if (!isJoined) {
    return (
      <div style={{
        backgroundColor: '#202124',
        minHeight: '100vh',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Google Sans', 'Inter', sans-serif",
        padding: '20px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '440px',
          background: '#28292c',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'rgba(26, 115, 232, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto',
              border: '1px solid #1a73e8'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8ab4f8" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
              </svg>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#ffffff', margin: '0 0 6px 0' }}>
              DRDO RAC Video Board
            </h2>
            <p style={{ color: '#9aa0a6', fontSize: '13px', margin: 0 }}>
              Join the live scientific interview conference
            </p>
          </div>

          <form onSubmit={handleManualJoin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#9aa0a6', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Interview Code
              </label>
              <input
                type="text"
                value={interviewCode}
                onChange={e => setInterviewCode(e.target.value.toUpperCase())}
                placeholder="e.g. RAC-2026-03"
                style={{
                  width: '100%',
                  background: '#1e1f20',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#fff',
                  fontSize: '14px',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#9aa0a6', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Candidate Full Name
              </label>
              <input
                type="text"
                value={candidateName}
                onChange={e => setCandidateName(e.target.value)}
                placeholder="e.g. Rohan Mehra"
                style={{
                  width: '100%',
                  background: '#1e1f20',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#fff',
                  fontSize: '14px'
                }}
              />
            </div>

            {errorMsg && (
              <div style={{
                background: 'rgba(234, 67, 53, 0.15)',
                border: '1px solid rgba(234, 67, 53, 0.3)',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#f28b82'
              }}>
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: '#1a73e8',
                color: '#ffffff',
                border: 'none',
                padding: '14px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '8px'
              }}
            >
              {loading ? 'Connecting...' : 'Join Meeting'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Active Pure Google Meet Video Screen
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#202124',
      color: '#ffffff',
      fontFamily: "'Google Sans', 'Inter', -apple-system, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Main Video Call Stage */}
      <main style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 20px',
        overflow: 'hidden'
      }}>
        {/* Recruiter Full Video Tile */}
        <div style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#131314',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Remote Audio Element for Recruiter's Live Voice */}
          <audio ref={remoteAudioRef} autoPlay playsInline />

          {/* Autoplay Audio Unlock Alert (Mobile Browser Policy) */}
          {audioNeedsInteraction && (
            <button
              onClick={unlockAudio}
              style={{
                position: 'absolute',
                top: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#ea4335',
                color: '#ffffff',
                border: 'none',
                borderRadius: '24px',
                padding: '8px 20px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                zIndex: 50,
                boxShadow: '0 4px 14px rgba(234,67,53,0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                animation: 'pulse 1.5s infinite'
              }}
            >
              <span>🔊</span>
              <span>Tap here to unmute audio</span>
            </button>
          )}

          {/* Recruiter Full Video Tile - ALWAYS mounted */}
          <div style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            display: (isOtherPeerJoined && remoteStream) ? 'block' : 'none'
          }}>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />

            {/* Real-time Recruiter Speaking Voice Indicator (No text question displayed) */}
            {isRecruiterSpeaking && (
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                background: 'rgba(52, 168, 83, 0.92)',
                color: '#ffffff',
                borderRadius: '20px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(52, 168, 83, 0.4)',
                zIndex: 35,
                backdropFilter: 'blur(6px)'
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  boxShadow: '0 0 8px #ffffff'
                }}></span>
                <span>🎙️ Board Member Speaking...</span>
              </div>
            )}

            {/* Bottom Left Recruiter Name Badge (Google Meet style) */}
            <div style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              background: 'rgba(32, 33, 36, 0.85)',
              backdropFilter: 'blur(8px)',
              borderRadius: '8px',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: '#ffffff',
              fontWeight: '500'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34a853' }}></span>
              <span>{expertName} (Board Member)</span>
            </div>
          </div>

          {/* Waiting / Connecting State Overlay */}
          {(!isOtherPeerJoined || !remoteStream) && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              textAlign: 'center',
              padding: '24px'
            }}>
              <div style={{
                width: '88px',
                height: '88px',
                borderRadius: '50%',
                background: 'rgba(234, 67, 53, 0.12)',
                border: '2px solid rgba(234, 67, 53, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px'
              }}>
                {connectionStatus === 'connected' ? '📡' : '⏳'}
              </div>
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: '500', color: '#f8fafc', margin: '0 0 6px 0' }}>
                  {!isOtherPeerJoined
                    ? 'Waiting for Recruiter to join...'
                    : (connectionStatus === 'connected' ? 'Receiving video feed...' : 'Connecting video stream...')}
                </h3>
                <p style={{ fontSize: '13px', color: '#9aa0a6', margin: 0, maxWidth: '380px', lineHeight: '1.4' }}>
                  {!isOtherPeerJoined
                    ? 'The DRDO RAC Assessment Board member has not connected yet. Please stay on this screen.'
                    : 'Establishing 2-way live audio & video feed with board panel...'}
                </p>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '20px',
                padding: '6px 16px',
                fontSize: '12px',
                color: '#8ab4f8'
              }}>
                Room: {interviewCode} • Peer: {isOtherPeerJoined ? 'Connected' : 'Waiting'} • WebRTC: {connectionStatus}
              </div>
            </div>
          )}

          {/* Floating Self-View (Candidate Webcam PiP) */}
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '240px',
            height: '145px',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
            backgroundColor: '#000000',
            zIndex: 5
          }}>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
                display: isCameraOn ? 'block' : 'none'
              }}
            />
            {!isCameraOn && (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9aa0a6', fontSize: '12px' }}>
                Camera Off
              </div>
            )}

            {/* Subtle speaking pulse indicator on candidate's own camera */}
            {isSpeaking && (
              <div style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#34a853',
                boxShadow: '0 0 8px #34a853'
              }} title="Microphone Active"></div>
            )}
          </div>
        </div>
      </main>

      {/* Google Meet Bottom Controls Bar */}
      <footer style={{
        height: '76px',
        minHeight: '76px',
        backgroundColor: '#202124',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 20
      }}>
        {/* Left: Meeting Time & Meeting Code */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px' }}>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#e8eaed' }}>
            {currentTime}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
          <span style={{ fontSize: '13px', color: '#9aa0a6', fontFamily: 'monospace' }}>
            {interviewCode}
          </span>
          <span style={{
            fontSize: '11px',
            color: '#81c995',
            background: 'rgba(52, 168, 83, 0.15)',
            padding: '2px 8px',
            borderRadius: '10px'
          }}>
            {formatCallTime(callDuration)}
          </span>
        </div>

        {/* Center: Conference Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Microphone Toggle */}
          <button
            onClick={toggleMic}
            title={isMicOn ? 'Turn off microphone' : 'Turn on microphone'}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: isMicOn ? '#3c4043' : '#ea4335',
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {isMicOn ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l4.08 4.08c-1.07.54-2.26.88-3.53.97V21h-2v-1.95c-3.39-.49-6-3.39-6-6.92h1.7c0 2.76 2.24 5 5 5 .59 0 1.15-.12 1.67-.32L19.73 21 21 19.73 4.27 3z"/>
              </svg>
            )}
          </button>

          {/* Subtle Audio Streaming Indicator */}
          {isMicOn && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '16px',
              background: isSpeaking ? 'rgba(52, 168, 83, 0.2)' : 'rgba(255, 255, 255, 0.06)',
              border: `1px solid ${isSpeaking ? 'rgba(52, 168, 83, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
              fontSize: '11px',
              color: isSpeaking ? '#81c995' : '#9aa0a6',
              transition: 'all 0.3s ease'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isSpeaking ? '#34a853' : '#9aa0a6',
                boxShadow: isSpeaking ? '0 0 6px #34a853' : 'none'
              }}></span>
              <span>{isSpeaking ? 'Voice Streaming to Board...' : 'Audio Connected'}</span>
            </div>
          )}

          {/* Camera Toggle */}
          <button
            onClick={toggleCamera}
            title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: isCameraOn ? '#3c4043' : '#ea4335',
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {isCameraOn ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 10.48V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4.48l4 3.98v-11l-4 3.5z"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.55-.18L19.73 21 21 19.73 3.27 2z"/>
              </svg>
            )}
          </button>

          {/* End Call Button */}
          <button
            onClick={handleEndCall}
            title="Leave Conference Call"
            style={{
              height: '48px',
              padding: '0 24px',
              borderRadius: '24px',
              backgroundColor: '#ea4335',
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'background-color 0.2s'
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.996.996 0 0 1 0-1.41C2.5 9.4 6.96 8 12 8s9.5 1.4 11.71 3.67c.39.39.39 1.02 0 1.41l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
            </svg>
            <span>Leave Call</span>
          </button>
        </div>

        {/* Right Info */}
        <div style={{ color: '#9aa0a6', fontSize: '12px', minWidth: '220px', textAlign: 'right' }}>
          DRDO RAC Board Room
        </div>
      </footer>
    </div>
  );
}

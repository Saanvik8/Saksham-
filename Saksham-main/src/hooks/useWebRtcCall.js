// src/hooks/useWebRtcCall.js
// Native WebRTC Peer-to-Peer 2-Way Live Audio & Video Hook
// Enables real microphone audio and webcam video streaming between Recruiter and Candidate
// Supports Google & Cloudflare STUN servers for instantaneous ICE candidate discovery

import { useState, useEffect, useRef, useCallback } from 'react';
import { interviewLiveService } from '../services/interviewLiveService';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' }
];

export function useWebRtcCall({ sessionId, role, isMicOn = true, isCameraOn = true }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isOtherPeerJoined, setIsOtherPeerJoined] = useState(false);
  const [peerLeftNotice, setPeerLeftNotice] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('waiting'); // 'waiting' | 'connecting' | 'connected'

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteMediaStreamRef = useRef(new MediaStream());
  const pendingIceCandidatesRef = useRef([]);
  const hasSentOfferRef = useRef(false);
  const isInitiator = role === 'recruiter';
  const offerInProgressRef = useRef(false);
  const isPollingRef = useRef(false);

  // Helper: Attach local tracks to peer connection senders or transceivers
  const attachLocalTracks = useCallback((pc, stream) => {
    if (!pc || !stream) return;
    try {
      const senders = pc.getSenders();
      stream.getTracks().forEach(track => {
        const existingSender = senders.find(
          s => s.track === track || (s.track && s.track.kind === track.kind) || (!s.track && s.kind === track.kind)
        );
        if (existingSender) {
          if (existingSender.track !== track) {
            existingSender.replaceTrack(track).catch(e => console.warn(`[WebRTC] [${role}] replaceTrack warning:`, e.message));
            console.log(`[WebRTC] [${role}] Replaced track on existing ${track.kind} sender. Track ID: ${track.id}`);
          }
        } else {
          try {
            pc.addTrack(track, stream);
            console.log(`[WebRTC] [${role}] Attached local ${track.kind} track to PeerConnection. Track ID: ${track.id}`);
          } catch (e) {
            console.warn(`[WebRTC] [${role}] Could not attach ${track.kind} track:`, e.message);
          }
        }
      });
      console.log(`[WebRTC] [${role}] Local tracks:`, stream.getTracks().map(t => `${t.kind}(${t.id}, enabled=${t.enabled}, state=${t.readyState})`));
      console.log(`[WebRTC] [${role}] Senders:`, pc.getSenders().map(s => `${s.track?.kind || 'empty'}(${s.track?.id || 'none'})`));
    } catch (err) {
      console.warn(`[WebRTC] [${role}] attachLocalTracks error:`, err);
    }
  }, [role]);

  // Helper: Safely add an ICE candidate
  const safeAddIceCandidate = useCallback(async (pc, candidateData) => {
    if (!pc || !candidateData) return;
    if (!candidateData.candidate && candidateData.candidate !== '') return;
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidateData));
      console.log(`[WebRTC] [${role}] Successfully added ICE candidate`);
    } catch (e) {
      // Ignore duplicate or late candidates
    }
  }, [role]);

  // Helper: Flush buffered ICE candidates once remote description is set
  const drainIceCandidates = useCallback(async (pc) => {
    if (!pc || !pc.remoteDescription) return;
    if (pendingIceCandidatesRef.current.length > 0) {
      console.log(`[WebRTC] [${role}] Draining ${pendingIceCandidatesRef.current.length} queued ICE candidate(s)...`);
      while (pendingIceCandidatesRef.current.length > 0) {
        const cand = pendingIceCandidatesRef.current.shift();
        await safeAddIceCandidate(pc, cand);
      }
    }
  }, [role, safeAddIceCandidate]);

  // Helper: Send SDP offer (Recruiter)
  const createAndSendOffer = useCallback(async (isRestart = false) => {
    const pc = pcRef.current;
    if (!pc || !sessionId || !isInitiator || offerInProgressRef.current) return;

    try {
      offerInProgressRef.current = true;
      console.log(`[WebRTC] [${role}] Generating SDP Offer (restart=${isRestart})...`);
      setConnectionStatus('connecting');

      // Wait up to 1.5 seconds for local media if not ready yet
      if (!localStreamRef.current) {
        for (let i = 0; i < 15; i++) {
          if (localStreamRef.current) break;
          await new Promise(r => setTimeout(r, 100));
        }
      }

      if (localStreamRef.current) {
        attachLocalTracks(pc, localStreamRef.current);
      }

      const offerOptions = {
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      };
      if (isRestart) {
        offerOptions.iceRestart = true;
      }

      const offer = await pc.createOffer(offerOptions);
      await pc.setLocalDescription(offer);

      console.log(`[WebRTC] [${role}] OFFER SENT`, {
        sdpLength: offer.sdp ? offer.sdp.length : 0,
        type: offer.type
      });

      await interviewLiveService.sendSignal(sessionId, {
        from: 'recruiter',
        to: 'candidate',
        type: 'offer',
        payload: offer
      });

      hasSentOfferRef.current = true;
      console.log(`[WebRTC] [${role}] Recruiter SDP Offer transmitted successfully to candidate.`);
    } catch (err) {
      console.error(`[WebRTC] [${role}] Error creating SDP offer:`, err);
    } finally {
      offerInProgressRef.current = false;
    }
  }, [sessionId, isInitiator, role, attachLocalTracks]);

  // 1. Capture Local Microphone & Webcam
  useEffect(() => {
    let stream = null;
    let isCancelled = false;

    const acquireMedia = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          console.warn(`[WebRTC] [${role}] mediaDevices.getUserMedia not supported in this environment.`);
          return;
        }

        try {
          // Attempt both Audio and Video with user-facing camera
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            },
            video: {
              facingMode: 'user',
              width: { ideal: 640 },
              height: { ideal: 480 }
            }
          });
        } catch (firstErr) {
          try {
            // Flexible fallback: generic video and audio
            stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: true
            });
          } catch (camErr) {
            console.warn(`[WebRTC] [${role}] Camera unavailable, falling back to audio-only:`, camErr.message);
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                audio: true
              });
            } catch (micErr) {
              console.warn(`[WebRTC] [${role}] Microphone unavailable:`, micErr.message);
            }
          }
        }

        if (isCancelled) {
          if (stream) {
            stream.getTracks().forEach(t => t.stop());
          }
          return;
        }

        if (stream) {
          console.log(`[WebRTC] [${role}] getUserMedia succeeded with ${stream.getVideoTracks().length} video track(s) and ${stream.getAudioTracks().length} audio track(s).`);
          localStreamRef.current = stream;
          setLocalStream(stream);

          // Attach tracks to RTCPeerConnection if already created
          if (pcRef.current) {
            attachLocalTracks(pcRef.current, stream);
          }
        } else {
          console.warn(`[WebRTC] [${role}] Running in receive-only mode (no local camera/mic acquired).`);
        }
      } catch (err) {
        console.error(`[WebRTC] [${role}] Local media acquisition failed:`, err);
      }
    };

    acquireMedia();

    return () => {
      isCancelled = true;
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
    };
  }, [role, attachLocalTracks]);

  // 2. Dynamic Mic Mute/Unmute
  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMicOn;
      });
    }
  }, [isMicOn]);

  // 3. Dynamic Camera Toggle
  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = isCameraOn;
      });
    }
  }, [isCameraOn]);

  // 4. Heartbeat: Peer Presence Tracking
  useEffect(() => {
    if (!sessionId) return;
    let isMounted = true;

    const checkPresence = async () => {
      try {
        const res = await interviewLiveService.sendHeartbeat(sessionId, role);
        if (res && res.success && res.data && isMounted) {
          const otherJoined = role === 'recruiter' ? res.data.candidateJoined : res.data.recruiterJoined;
          if (isOtherPeerJoined && !otherJoined) {
            // Other peer was connected and has now disconnected
            setPeerLeftNotice(role === 'recruiter' ? 'Candidate left the interview' : 'Recruiter ended the interview');
          }
          if (otherJoined) {
            setIsOtherPeerJoined(true);
          }
        }
      } catch (e) {
        // silent
      }
    };

    checkPresence();
    const presenceTimer = setInterval(checkPresence, 2000);
    return () => {
      isMounted = false;
      clearInterval(presenceTimer);
    };
  }, [sessionId, role, isOtherPeerJoined]);

  // 5. Setup RTCPeerConnection Lifecycle
  useEffect(() => {
    if (!sessionId) return;
    let isMounted = true;

    console.log(`[WebRTC] [${role}] Initializing RTCPeerConnection with STUN servers...`);
    const pc = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
      iceCandidatePoolSize: 2
    });
    pcRef.current = pc;
    hasSentOfferRef.current = false;
    pendingIceCandidatesRef.current = [];

    // Add audio and video transceivers up-front to guarantee both media lines exist in SDP
    try {
      pc.addTransceiver('audio', { direction: 'sendrecv' });
      pc.addTransceiver('video', { direction: 'sendrecv' });
      console.log(`[WebRTC] [${role}] Pre-configured audio and video transceivers (sendrecv).`);
    } catch (e) {
      console.warn(`[WebRTC] [${role}] addTransceiver fallback:`, e.message);
    }

    // Add local tracks if already available
    if (localStreamRef.current) {
      attachLocalTracks(pc, localStreamRef.current);
    }

    // Remote audio/video tracks receiver
    pc.ontrack = (event) => {
      const track = event.track;
      console.log(`[WebRTC] [${role}] REMOTE TRACK RECEIVED: kind=${track.kind}, id=${track.id}, enabled=${track.enabled}, readyState=${track.readyState}`);

      if (!isMounted) return;

      const remoteStreamInst = remoteMediaStreamRef.current;
      // Replace old track of same kind if track ID changed
      remoteStreamInst.getTracks().forEach(t => {
        if (t.kind === track.kind && t.id !== track.id) {
          remoteStreamInst.removeTrack(t);
        }
      });
      if (!remoteStreamInst.getTracks().some(t => t.id === track.id)) {
        remoteStreamInst.addTrack(track);
      }

      track.onunmute = () => {
        console.log(`[WebRTC] [${role}] Track unmuted: ${track.kind}`);
        if (isMounted) {
          setRemoteStream(new MediaStream(remoteMediaStreamRef.current.getTracks()));
        }
      };

      // Dispatch a fresh MediaStream instance so React state updates and triggers element play
      const updatedStream = new MediaStream(remoteMediaStreamRef.current.getTracks());
      setRemoteStream(updatedStream);
      setIsOtherPeerJoined(true);
      setConnectionStatus('connected');
    };

    // ICE candidate generation
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`[WebRTC] [${role}] Generated ICE candidate:`, event.candidate.candidate);
        interviewLiveService.sendSignal(sessionId, {
          from: role,
          to: isInitiator ? 'candidate' : 'recruiter',
          type: 'ice',
          payload: event.candidate.toJSON ? event.candidate.toJSON() : {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            usernameFragment: event.candidate.usernameFragment
          }
        }).catch(() => {});
      }
    };

    // Connection state monitor
    const updateConnectionState = () => {
      if (!isMounted) return;
      const cState = pc.connectionState;
      const iceState = pc.iceConnectionState;
      console.log(`[WebRTC] [${role}] PeerConnection State: ${cState} | ICE State: ${iceState}`);

      if (cState === 'connected' || iceState === 'connected' || iceState === 'completed') {
        setConnectionStatus('connected');
        setIsOtherPeerJoined(true);
      } else if (cState === 'connecting' || iceState === 'checking') {
        setConnectionStatus('connecting');
      } else if (cState === 'failed' || iceState === 'failed') {
        console.warn(`[WebRTC] [${role}] ICE Connection failed.`);
      } else if (cState === 'disconnected' || iceState === 'disconnected') {
        setConnectionStatus('waiting');
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] [${role}] Connection state:`, pc.connectionState);
      updateConnectionState();
    };
    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] [${role}] ICE state:`, pc.iceConnectionState);
      updateConnectionState();
    };
    pc.onsignalingstatechange = () => {
      console.log(`[WebRTC] [${role}] Signaling state:`, pc.signalingState);
    };
    pc.onicegatheringstatechange = () => {
      console.log(`[WebRTC] [${role}] ICE gathering:`, pc.iceGatheringState);
    };

    // Polling for incoming signals with concurrency lock
    const pollSignals = async () => {
      if (!isMounted || isPollingRef.current) return;
      isPollingRef.current = true;

      try {
        const res = await interviewLiveService.getSignals(sessionId, role);
        if (res && res.success && Array.isArray(res.data?.signals)) {
          for (const sig of res.data.signals) {
            if (sig.type === 'peer_left') {
              console.log(`[WebRTC] [${role}] Peer left signal received: ${sig.from}`);
              setIsOtherPeerJoined(false);
              setRemoteStream(null);
              setPeerLeftNotice(sig.from === 'recruiter' ? 'The Assessment Board member has ended the session' : 'Candidate has left the meeting');
            } else if (sig.type === 'ready_for_offer' && isInitiator) {
              console.log(`[WebRTC] [${role}] Recruiter received ready_for_offer from candidate! Generating fresh Offer...`);
              setIsOtherPeerJoined(true);
              createAndSendOffer(false);
            } else if (sig.type === 'offer' && !isInitiator) {
              console.log(`[WebRTC] [${role}] OFFER RECEIVED`, {
                sdpLength: sig.payload?.sdp ? sig.payload.sdp.length : 0,
                type: sig.payload?.type
              });
              setConnectionStatus('connecting');

              // Wait up to 1.5 seconds for local media if not ready yet
              if (!localStreamRef.current) {
                for (let i = 0; i < 15; i++) {
                  if (localStreamRef.current) break;
                  await new Promise(r => setTimeout(r, 100));
                }
              }

              if (localStreamRef.current) {
                attachLocalTracks(pc, localStreamRef.current);
              }

              await pc.setRemoteDescription(new RTCSessionDescription(sig.payload));
              await drainIceCandidates(pc);

              const answer = await pc.createAnswer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
              });
              await pc.setLocalDescription(answer);

              console.log(`[WebRTC] [${role}] ANSWER SENT`, {
                sdpLength: answer.sdp ? answer.sdp.length : 0,
                type: answer.type
              });

              await interviewLiveService.sendSignal(sessionId, {
                from: 'candidate',
                to: 'recruiter',
                type: 'answer',
                payload: answer
              });
              console.log(`[WebRTC] [${role}] Candidate Answer transmitted back to recruiter.`);
            } else if (sig.type === 'answer' && isInitiator) {
              console.log(`[WebRTC] [${role}] ANSWER RECEIVED`, {
                sdpLength: sig.payload?.sdp ? sig.payload.sdp.length : 0,
                type: sig.payload?.type
              });
              if (pc.signalingState === 'have-local-offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(sig.payload));
                await drainIceCandidates(pc);
                setConnectionStatus('connected');
                setIsOtherPeerJoined(true);
              } else {
                console.warn(`[WebRTC] [${role}] Received answer in unexpected state: ${pc.signalingState}`);
              }
            } else if (sig.type === 'ice' && sig.payload) {
              if (pc.remoteDescription && pc.remoteDescription.type) {
                await safeAddIceCandidate(pc, sig.payload);
              } else {
                pendingIceCandidatesRef.current.push(sig.payload);
                console.log(`[WebRTC] [${role}] Queued ICE candidate (waiting for remote description). Total: ${pendingIceCandidatesRef.current.length}`);
              }
            }
          }
        }
      } catch (err) {
        console.warn(`[WebRTC] [${role}] Signal poll error:`, err.message);
      } finally {
        isPollingRef.current = false;
      }
    };

    const signalPollTimer = setInterval(pollSignals, 1000);

    return () => {
      isMounted = false;
      clearInterval(signalPollTimer);
      try {
        pc.close();
      } catch (e) {}
    };
  }, [sessionId, role, isInitiator, attachLocalTracks, createAndSendOffer, drainIceCandidates, safeAddIceCandidate]);

  // 6. Offer Triggering when other peer joins
  useEffect(() => {
    if (!isInitiator) return;

    if (isOtherPeerJoined && !hasSentOfferRef.current && pcRef.current) {
      createAndSendOffer(false);
    }
  }, [isOtherPeerJoined, isInitiator, createAndSendOffer]);

  // 7. Candidate announces ready_for_offer on mount
  useEffect(() => {
    if (isInitiator || !sessionId) return;
    const announceReady = async () => {
      try {
        console.log(`[WebRTC] [${role}] Candidate announcing ready_for_offer to recruiter...`);
        await interviewLiveService.sendSignal(sessionId, {
          from: 'candidate',
          to: 'recruiter',
          type: 'ready_for_offer'
        });
      } catch (e) {}
    };
    const t = setTimeout(announceReady, 500);
    return () => clearTimeout(t);
  }, [sessionId, isInitiator, role]);

  // Explicit Leave Call helper
  const leaveCall = useCallback(async () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      try { pcRef.current.close(); } catch (e) {}
    }
    try {
      await interviewLiveService.leaveCall(sessionId, role);
    } catch (e) {}
  }, [sessionId, role]);

  return {
    localStream,
    remoteStream,
    isOtherPeerJoined,
    peerLeftNotice,
    connectionStatus,
    leaveCall
  };
}

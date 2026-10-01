// src/components/interview/VideoFeed.jsx
import { useEffect, useRef } from 'react';

export default function VideoFeed({ label = "Candidate", isExpert = false, isMock = false, isCameraActive = true }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (isMock || !isCameraActive) return;

    let activeStream = null;
    navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        activeStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.warn("Camera stream access note:", err?.message || err);
      });

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [isMock, isCameraActive]);

  return (
    <div style={{
      position: 'relative',
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid rgba(201, 168, 76, 0.2)',
      aspectRatio: '16/9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%'
    }}>
      {isMock ? (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.8))',
          color: '#94a3b8',
          gap: '10px'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(201, 168, 76, 0.15)',
            border: '2px solid rgba(201, 168, 76, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#c9a84c',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            CP
          </div>
          <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
            Candidate Stream (Connected)
          </div>
          <div style={{ fontSize: '11px', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
            Live Feed Active
          </div>
        </div>
      ) : !isCameraActive ? (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#020617',
          color: '#64748b',
          gap: '6px'
        }}>
          <div style={{ fontSize: '24px' }}>Camera Disabled</div>
          <div style={{ fontSize: '12px' }}>Video paused by user</div>
        </div>
      ) : (
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted={isExpert} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        background: 'rgba(10, 22, 40, 0.85)',
        color: '#ffffff',
        padding: '4px 10px',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: "'Inter', sans-serif",
        border: '1px solid #c9a84c',
        zIndex: 2
      }}>
        {label}
      </div>
    </div>
  );
}

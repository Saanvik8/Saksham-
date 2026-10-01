// src/components/interview/InterviewControls.jsx
import { useState } from 'react';

export default function InterviewControls({ 
  onNextPhase, 
  onEndReport, 
  onToggleCamera, 
  onToggleAudio,
  isGeneratingReport = false,
  reportError = ''
}) {
  const [isAudioActive, setIsAudioActive] = useState(true);
  const [isVideoActive, setIsVideoActive] = useState(true);

  const handleToggleAudio = () => {
    const nextState = !isAudioActive;
    setIsAudioActive(nextState);
    if (onToggleAudio) onToggleAudio(nextState);
  };

  const handleToggleVideo = () => {
    const nextState = !isVideoActive;
    setIsVideoActive(nextState);
    if (onToggleCamera) onToggleCamera(nextState);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      alignItems: 'center'
    }}>
      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.03)',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        fontFamily: "'Inter', sans-serif"
      }}>
        <button 
          onClick={handleToggleAudio}
          style={{ 
            background: isAudioActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
            color: isAudioActive ? '#22c55e' : '#f87171', 
            border: isAudioActive ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)', 
            padding: '8px 16px', 
            borderRadius: '6px', 
            fontSize: '12px', 
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          {isAudioActive ? 'Audio Active' : 'Audio Muted'}
        </button>
        <button 
          onClick={handleToggleVideo}
          style={{ 
            background: isVideoActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
            color: isVideoActive ? '#22c55e' : '#f87171', 
            border: isVideoActive ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)', 
            padding: '8px 16px', 
            borderRadius: '6px', 
            fontSize: '12px', 
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          {isVideoActive ? 'Video Active' : 'Video Off'}
        </button>
        <button 
          onClick={onNextPhase} 
          style={{ 
            background: 'rgba(255,255,255,0.06)', 
            color: '#fff', 
            border: '1px solid rgba(201,168,76,0.4)', 
            padding: '8px 16px', 
            borderRadius: '6px', 
            fontSize: '12px', 
            cursor: 'pointer', 
            fontWeight: '600' 
          }}
        >
          Advance Phase
        </button>
        <button 
          onClick={onEndReport} 
          disabled={isGeneratingReport}
          style={{ 
            background: isGeneratingReport ? '#475569' : '#ef4444', 
            color: '#fff', 
            border: 'none', 
            padding: '8px 16px', 
            borderRadius: '6px', 
            fontSize: '12px', 
            cursor: isGeneratingReport ? 'not-allowed' : 'pointer', 
            fontWeight: '700', 
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          {isGeneratingReport ? 'Generating Assessment Report...' : 'Conclude & Generate Report'}
        </button>
      </div>

      {reportError && (
        <div style={{
          color: '#f87171',
          fontSize: '12px',
          background: 'rgba(239, 68, 68, 0.1)',
          padding: '6px 14px',
          borderRadius: '4px',
          border: '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          {reportError}
        </div>
      )}
    </div>
  );
}

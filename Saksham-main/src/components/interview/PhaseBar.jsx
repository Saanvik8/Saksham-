// src/components/interview/PhaseBar.jsx
import { useState, useEffect } from 'react';

export default function PhaseBar({ currentPhase = 2, totalPhases = 3, timeLeft }) {
  const phaseNames = { 1: 'Ice Breaking', 2: 'Technical Evaluation', 3: 'Managerial Assessment' };

  // Parse starting seconds (default: 32 min 14 sec = 1934s)
  const initialSeconds = (() => {
    if (typeof timeLeft === 'string' && timeLeft.includes(':')) {
      const [m, s] = timeLeft.split(':').map(Number);
      if (!isNaN(m) && !isNaN(s)) return m * 60 + s;
    }
    return 1934;
  })();

  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: 'rgba(255, 255, 255, 0.03)',
      padding: '12px 20px',
      borderRadius: '6px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ color: '#c9a84c', fontWeight: '600', fontSize: '13px', letterSpacing: '0.5px' }}>
        STAGE {currentPhase} OF {totalPhases}: {phaseNames[currentPhase]?.toUpperCase()}
      </div>
      <div style={{ color: '#94a3b8', fontSize: '13px', fontVariantNumeric: 'tabular-nums' }}>
        Time Remaining: <span style={{ color: secondsRemaining < 300 ? '#ef4444' : '#e2e8f0', fontWeight: '600' }}>{formatTime(secondsRemaining)}</span>
      </div>
    </div>
  );
}


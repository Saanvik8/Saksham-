// src/components/interview/TranscriptPanel.jsx
import { useState } from 'react';

export default function TranscriptPanel({ transcript, onAddEntry }) {
  const [inputText, setInputText] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onAddEntry({ role: 'Expert', text: inputText });
    setInputText('');
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      height: '240px',
      fontFamily: "'Inter', sans-serif"
    }}>
      <h3 style={{ color: '#c9a84c', margin: '0 0 10px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Session Transcript Log
      </h3>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px', paddingRight: '4px' }}>
        {transcript.map((item, idx) => (
          <div key={idx} style={{ fontSize: '12px', lineHeight: '1.4', color: item.role === 'Expert' ? '#ffffff' : '#94a3b8' }}>
            <strong style={{ color: '#c9a84c' }}>{item.role}:</strong> {item.text} {item.score && <span style={{ color: '#22c55e' }}>(Score: {item.score})</span>}
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px' }}>
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter observation or prompt note..."
          style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '8px 12px', color: '#fff', fontSize: '12px' }}
        />
        <button type="submit" style={{ background: '#c9a84c', color: '#0a1628', border: 'none', padding: '8px 14px', borderRadius: '6px', fontWeight: '700', fontSize: '11px', cursor: 'pointer', textTransform: 'uppercase' }}>Log</button>
      </form>
    </div>
  );
}

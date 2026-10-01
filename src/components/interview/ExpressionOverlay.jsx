// src/components/interview/ExpressionOverlay.jsx
export default function ExpressionOverlay({
  expressionData,
  isAnalyzing = false,
  isActive = true,
  error = null
}) {
  const confidenceVal = expressionData?.confidence !== undefined
    ? (typeof expressionData.confidence === 'number' ? `${expressionData.confidence}%` : expressionData.confidence)
    : '—';

  const emotionVal = expressionData?.dominantEmotion || expressionData?.emotion || (isAnalyzing ? 'Analyzing...' : 'Standby');

  return (
    <div style={{
      position: 'absolute',
      top: '12px',
      right: '12px',
      background: 'rgba(10, 22, 40, 0.9)',
      padding: '6px 12px',
      borderRadius: '4px',
      border: '1px solid #c9a84c',
      color: '#fff',
      fontSize: '11px',
      letterSpacing: '0.5px',
      textTransform: 'uppercase',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      zIndex: 3
    }}>
      <span style={{
        width: '7px',
        height: '7px',
        borderRadius: '50%',
        backgroundColor: !isActive ? '#64748b' : isAnalyzing ? '#eab308' : '#22c55e',
        display: 'inline-block'
      }} />
      <span>
        {isActive ? (isAnalyzing ? 'Telemetry Syncing' : 'Telemetry Active') : 'Telemetry Paused'}
        {confidenceVal !== '—' ? ` • Conf: ${confidenceVal} • ${emotionVal}` : ''}
      </span>
    </div>
  );
}

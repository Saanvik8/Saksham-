// src/components/interview/AIPanel.jsx
export default function AIPanel({
  currentQuestion,
  isFollowUp = false,
  onUseQuestion,
  onGrade,
  grades,
  isGrading = false,
  followUpQuestions = [],
  onSelectFollowUp,
  onGenerateFollowUp,
  isGeneratingFollowUp = false,
  followUpError = '',
  expressionData = null,
  isAnalyzingExpression = false
}) {
  const questionText = typeof currentQuestion === 'object' && currentQuestion !== null
    ? (currentQuestion.question || '')
    : (currentQuestion || '');

  const difficulty = typeof currentQuestion === 'object' ? currentQuestion.difficulty : null;
  const relevance = typeof currentQuestion === 'object' ? currentQuestion.relevanceScore : null;

  const displayScore = grades?.answerScore !== undefined
    ? `${grades.answerScore}/10`
    : (grades?.score || 'Pending');

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      borderRadius: '8px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      fontFamily: "'Inter', sans-serif"
    }}>
      <h3 style={{ color: '#c9a84c', margin: 0, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Assistant Co-Pilot
      </h3>
      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(201,168,76,0.2)' }}>
        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Recommended Prompt:</span>
          {isFollowUp && (
            <span style={{
              background: 'rgba(201,168,76,0.2)',
              color: '#c9a84c',
              border: '1px solid rgba(201,168,76,0.4)',
              padding: '1px 5px',
              borderRadius: '3px',
              fontSize: '9px',
              fontWeight: '700'
            }}>
              FOLLOW-UP
            </span>
          )}
        </div>
        <div style={{ fontSize: '13px', color: '#fff', marginBottom: '10px', lineHeight: '1.4' }}>
          "{questionText}"
          {(difficulty || relevance) && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px', fontSize: '11px', color: '#94a3b8' }}>
              {difficulty && <span>Difficulty: <strong style={{ color: '#e2e8f0' }}>{difficulty}</strong></span>}
              {relevance !== null && relevance !== undefined && <span>Relevance: <strong style={{ color: '#c9a84c' }}>{relevance}/10</strong></span>}
            </div>
          )}
        </div>
        <button 
          onClick={() => onUseQuestion(questionText)} 
          style={{ background: '#c9a84c', color: '#0a1628', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase' }}
        >
          Insert to Transcript
        </button>
      </div>

      {/* Adaptive Follow-Up Questions Section */}
      <div style={{
        background: 'rgba(0,0,0,0.3)',
        padding: '12px',
        borderRadius: '6px',
        border: '1px solid rgba(201,168,76,0.2)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <span style={{ fontSize: '11px', color: '#c9a84c', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>
            Targeted Follow-Up
          </span>
          {onGenerateFollowUp && (
            <button
              onClick={onGenerateFollowUp}
              disabled={isGeneratingFollowUp}
              style={{
                background: 'transparent',
                border: '1px solid rgba(201,168,76,0.4)',
                color: '#c9a84c',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: isGeneratingFollowUp ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                textTransform: 'uppercase'
              }}
            >
              {isGeneratingFollowUp ? 'Analyzing...' : 'Generate Follow-Up'}
            </button>
          )}
        </div>

        {followUpError && (
          <div style={{ fontSize: '11px', color: '#fca5a5', marginBottom: '6px' }}>
            {followUpError}
          </div>
        )}

        {followUpQuestions && followUpQuestions.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {followUpQuestions.map((fq, idx) => {
              const qText = typeof fq === 'object' ? (fq.question || '') : String(fq);
              const diff = typeof fq === 'object' ? fq.difficulty : null;
              const rel = typeof fq === 'object' ? fq.relevanceScore : null;
              return (
                <div
                  key={fq.id || idx}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '6px',
                    padding: '8px 10px'
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: '1.4', marginBottom: '6px' }}>
                    "{qText}"
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', gap: '8px' }}>
                      {diff && <span>Difficulty: <strong style={{ color: '#cbd5e1' }}>{diff}</strong></span>}
                      {rel !== null && rel !== undefined && <span>Relevance: <strong style={{ color: '#c9a84c' }}>{rel}</strong></span>}
                    </div>
                    {onSelectFollowUp && (
                      <button
                        onClick={() => onSelectFollowUp(fq)}
                        style={{
                          background: '#c9a84c',
                          color: '#0a1628',
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          textTransform: 'uppercase'
                        }}
                      >
                        Ask Follow-Up
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : !isGeneratingFollowUp && (
          <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
            No targeted follow-up questions available.
          </div>
        )}
      </div>
      
      <div>
        <h4 style={{ color: '#c9a84c', margin: '0 0 6px 0', fontSize: '12px', textTransform: 'uppercase' }}>Live Metrics</h4>
        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
          Response Score: <span style={{ color: '#22c55e', fontWeight: '600' }}>{displayScore}</span>
        </div>

        {/* Evaluation Metrics Breakdown */}
        {grades && (grades.relevancePct !== undefined || grades.accuracyPct !== undefined) && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px',
            marginBottom: '10px'
          }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '4px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Relevance</div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#e2e8f0', marginTop: '2px' }}>{grades.relevancePct ?? '--'}%</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '4px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Accuracy</div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#e2e8f0', marginTop: '2px' }}>{grades.accuracyPct ?? '--'}%</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '4px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Completeness</div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#e2e8f0', marginTop: '2px' }}>{grades.completenessPct ?? '--'}%</div>
            </div>
          </div>
        )}

        {grades?.observation && (
          <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.4', marginBottom: '6px' }}>
            <span style={{ color: '#c9a84c', fontWeight: '600' }}>Observation: </span>
            {grades.observation}
          </div>
        )}

        {grades?.evidence && (
          <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.4', marginBottom: '6px' }}>
            <span style={{ color: '#94a3b8', fontWeight: '600' }}>Evidence: </span>
            {grades.evidence}
          </div>
        )}

        {grades?.missingConcepts && Array.isArray(grades.missingConcepts) && grades.missingConcepts.length > 0 && (
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '10px', color: '#f87171', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '600' }}>
              Missing Concepts:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {grades.missingConcepts.map((concept, idx) => (
                <span
                  key={idx}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#fca5a5',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '10px'
                  }}
                >
                  {concept}
                </span>
              ))}
            </div>
          </div>
        )}

        {grades?.feedback && (
          <div style={{
            fontSize: '11px',
            color: '#38bdf8',
            background: 'rgba(56, 189, 248, 0.08)',
            borderLeft: '2px solid #38bdf8',
            padding: '6px 8px',
            borderRadius: '0 4px 4px 0',
            lineHeight: '1.4',
            marginBottom: '10px'
          }}>
            <strong style={{ color: '#7dd3fc' }}>Feedback: </strong>
            {grades.feedback}
          </div>
        )}

        <button 
          onClick={onGrade}
          disabled={isGrading}
          style={{
            width: '100%',
            background: isGrading ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
            color: isGrading ? '#94a3b8' : '#fff',
            border: '1px solid rgba(201,168,76,0.4)',
            padding: '8px',
            borderRadius: '6px',
            cursor: isGrading ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: '12px',
            textTransform: 'uppercase'
          }}
        >
          {isGrading ? 'Evaluating Response...' : 'Evaluate Response'}
        </button>
      </div>

      {/* Delivery Telemetry Section */}
      <div style={{
        background: 'rgba(0,0,0,0.3)',
        padding: '12px',
        borderRadius: '6px',
        border: '1px solid rgba(201,168,76,0.2)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <h4 style={{ color: '#c9a84c', margin: 0, fontSize: '12px', textTransform: 'uppercase' }}>
            Delivery Telemetry
          </h4>
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>
            {expressionData?.dominantEmotion ? `Emotion: ${expressionData.dominantEmotion}` : (isAnalyzingExpression ? 'Syncing...' : 'Observational')}
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '6px',
          marginBottom: '8px'
        }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Confidence</div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#e2e8f0', marginTop: '2px' }}>
              {expressionData?.confidence !== undefined ? `${expressionData.confidence}%` : '—'}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Engagement</div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#e2e8f0', marginTop: '2px' }}>
              {expressionData?.engagement !== undefined ? `${expressionData.engagement}%` : '—'}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Eye Contact</div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#e2e8f0', marginTop: '2px' }}>
              {expressionData?.eyeContact !== undefined ? `${expressionData.eyeContact}%` : '—'}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Nervousness</div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: expressionData?.nervousness > 40 ? '#f87171' : '#e2e8f0', marginTop: '2px' }}>
              {expressionData?.nervousness !== undefined ? `${expressionData.nervousness}%` : '—'}
            </div>
          </div>
        </div>

        <div style={{ fontSize: '10px', color: '#64748b', lineHeight: '1.3' }}>
          Dominant Emotion: <strong style={{ color: '#cbd5e1' }}>{expressionData?.dominantEmotion || '—'}</strong>
          <span style={{ display: 'block', marginTop: '2px', color: '#64748b' }}>Observational telemetry for expert panel reference only.</span>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import './ResultPanel.css';

const API_URL = 'https://valiant-expression-production-a4f5.up.railway.app';

// ── CEFR score jadvali (to'g'ri javoblar soni → ball) ──
const SCORE_TABLE = {
  1:20,  2:24,  3:27,  4:29,  5:32,  6:34,  7:36,  8:38,  9:39,
  10:41, 11:42, 12:44, 13:45, 14:46, 15:48, 16:49, 17:51, 18:52,
  19:54, 20:55, 21:57, 22:58, 23:60, 24:61, 25:63, 26:65, 27:66,
  28:68, 29:70, 30:71, 31:73, 32:74, 33:75, 34:75, 35:75,
};

const getCEFR = (correctCount) => {
  const ball = SCORE_TABLE[correctCount] || 0;
  if (ball >= 65) return { level: 'C1', color: '#0369a1', range: '65–75', ball };
  if (ball >= 51) return { level: 'B2', color: '#0f6e56', range: '51–64', ball };
  if (ball >= 38) return { level: 'B1', color: '#854f0b', range: '38–50', ball };
  return             { level: 'B1 dan quyi', color: '#dc2626', range: '0–37', ball };
};

const getBand = (pct) => {
  if (pct >= 95) return { band: '9.0', label: 'Expert',    color: '#0369a1' };
  if (pct >= 87) return { band: '8.5', label: 'Very Good', color: '#0369a1' };
  if (pct >= 80) return { band: '8.0', label: 'Very Good', color: '#0f6e56' };
  if (pct >= 72) return { band: '7.5', label: 'Good',      color: '#0f6e56' };
  if (pct >= 64) return { band: '7.0', label: 'Good',      color: '#0f6e56' };
  if (pct >= 56) return { band: '6.5', label: 'Competent', color: '#854f0b' };
  if (pct >= 48) return { band: '6.0', label: 'Competent', color: '#854f0b' };
  if (pct >= 40) return { band: '5.5', label: 'Modest',    color: '#854f0b' };
  if (pct >= 32) return { band: '5.0', label: 'Modest',    color: '#dc2626' };
  return           { band: '4.0', label: 'Limited',        color: '#dc2626' };
};

// ── Barcha part turlaridan natijalarni yig'uvchi helper ──
function buildResults(parts, userAnswers) {
  const allResults = [];

  parts.forEach(part => {

    // reading-mixed (Part 5)
    if (part.type === 'reading-mixed') {
      (part.question_groups || []).forEach(group => {
        if (group.type === 'fitb') {
          (group.questions || []).forEach(q => {
            const user    = (userAnswers[q.id] || '').toLowerCase().trim();
            const correct = (q.correctAnswer   || '').toLowerCase().trim();
            allResults.push({
              id: q.id,
              question_number: q.number,
              user_answer:    userAnswers[q.id] || '',
              correct_answer: q.correctAnswer   || '',
              explanation:    part.explanations?.[q.id] || '',
              is_correct:     user === correct,
            });
          });
        }
        if (group.type === 'mcq') {
          (group.questions || []).forEach(q => {
            const correct = part.answers?.[q.id] || '';
            const user    = (userAnswers[q.id] || '').toUpperCase().trim();
            allResults.push({
              id: q.id,
              question_number: q.number,
              user_answer:    userAnswers[q.id] || '',
              correct_answer: correct,
              explanation:    part.explanations?.[q.id] || '',
              is_correct:     user === correct.toUpperCase().trim(),
            });
          });
        }
      });
      return;
    }

    // reading-mcq (Part 4)
    if (part.type === 'reading-mcq') {
      const groups = part.question_groups || [{ questions: part.questions || [] }];
      groups.forEach(group => {
        (group.questions || []).forEach(q => {
          const correct = part.answers?.[q.id] || '';
          const user    = (userAnswers[q.id] || '').toUpperCase().trim();
          allResults.push({
            id: q.id,
            question_number: q.number,
            user_answer:    userAnswers[q.id] || '',
            correct_answer: correct,
            explanation:    part.explanations?.[q.id] || '',
            is_correct:     user === correct.toUpperCase().trim(),
          });
        });
      });
      return;
    }

    // matching (Part 2)
    if (part.type === 'matching') {
      (part.questions || []).forEach(q => {
        const correct = part.answers?.[q.id] || '';
        const user    = (userAnswers[q.id] || '').toUpperCase().trim();
        allResults.push({
          id: q.id,
          question_number: q.number,
          user_answer:    userAnswers[q.id] || '',
          correct_answer: correct,
          explanation:    part.explanations?.[q.id] || '',
          is_correct:     user === correct.toUpperCase().trim(),
        });
      });
      return;
    }

    // heading-match (Part 3)
    if (part.type === 'heading-match') {
      (part.paragraphs || []).forEach(para => {
        const correct = part.answers?.[para.id] || '';
        const user    = (userAnswers[para.id] || '').toUpperCase().trim();
        allResults.push({
          id: para.id,
          question_number: para.number,
          user_answer:    userAnswers[para.id] || '',
          correct_answer: correct,
          explanation:    part.explanations?.[para.id] || '',
          is_correct:     user === correct.toUpperCase().trim(),
        });
      });
      return;
    }

    // FITB (Part 1 va boshqalar)
    if (!part.answers) return;
    Object.entries(part.answers).forEach(([id, correct]) => {
      const user        = (userAnswers[id] || '').toLowerCase().trim();
      const passageItem = part.passage?.find(p => p.id === id);
      allResults.push({
        id,
        question_number: passageItem?.number ?? id,
        user_answer:    userAnswers[id] || '',
        correct_answer: correct,
        explanation:    part.explanations?.[id] || '',
        is_correct:     user === correct.toLowerCase().trim(),
      });
    });
  });

  return allResults;
}

export default function ResultPanel({ parts, userAnswers, isFullMock }) {
  const [showCorrect,   setShowCorrect]   = useState(false);
  const [showExpl,      setShowExpl]      = useState(false);
  const [feedback,      setFeedback]      = useState('');
  const [rating,        setRating]        = useState(0);
  const [feedbackSent,  setFeedbackSent]  = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [submitting,    setSubmitting]    = useState(false);

  const allResults = buildResults(parts, userAnswers);
  const score      = allResults.filter(r => r.is_correct).length;
  const total      = allResults.length;
  const percent    = total > 0 ? Math.round((score / total) * 100) : 0;
  const { band, label, color } = getBand(percent);

  const circ    = 2 * Math.PI * 40;
  const dashOff = circ * (1 - percent / 100);

  // CEFR — faqat full mock uchun
  const cefr = isFullMock ? getCEFR(score) : null;

  const handleFeedback = async () => {
    if (!feedback.trim()) { setFeedbackError('Iltimos, feedback yozing'); return; }
    setSubmitting(true); setFeedbackError('');
    try {
      const token = localStorage.getItem('cp_token');
      const res = await fetch(`${API_URL}/feedback/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: feedback.trim(), rating: rating || null }),
      });
      if (res.ok) {
        setFeedbackSent(true);
      } else {
        const d = await res.json();
        setFeedbackError(d.detail || 'Xatolik yuz berdi');
      }
    } catch {
      setFeedbackError("Tarmoq xatosi. Qayta urinib ko'ring.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rp-root">

      {/* ── HERO ── */}
      <div className="rp-hero">
        <div className="rp-hero-left">
          <div className="rp-ring-wrap">
            <svg width="110" height="110" viewBox="0 0 110 110">
              <circle cx="55" cy="55" r="40" fill="none" stroke="#f0efed" strokeWidth="8" />
              <circle
                cx="55" cy="55" r="40"
                fill="none" stroke={color}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={dashOff}
                transform="rotate(-90 55 55)"
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
            </svg>
            <div className="rp-ring-inner">
              <span className="rp-ring-score" style={{ color }}>{score}</span>
              <span className="rp-ring-total">/ {total}</span>
            </div>
          </div>

          <div className="rp-hero-stats">
            <div className="rp-stat-row">
              <div className="rp-stat-box correct">
                <span className="rp-stat-val">{score}</span>
                <span className="rp-stat-lbl">Correct</span>
              </div>
              <div className="rp-stat-box wrong">
                <span className="rp-stat-val">{total - score}</span>
                <span className="rp-stat-lbl">Wrong</span>
              </div>
              <div className="rp-stat-box neutral">
                <span className="rp-stat-val">{percent}%</span>
                <span className="rp-stat-lbl">Score</span>
              </div>
            </div>

            {/* ── CEFR karta — faqat full mock ── */}
            {cefr && (
              <div className="rp-cefr-card" style={{ borderColor: cefr.color }}>
                <div className="rp-cefr-top">
                  <span className="rp-cefr-label">CEFR Level</span>
                  <span className="rp-cefr-level" style={{ color: cefr.color }}>{cefr.level}</span>
                </div>
                <div className="rp-cefr-bottom">
                  <span className="rp-cefr-ball-label">O'qish bali:</span>
                  <span className="rp-cefr-ball" style={{ color: cefr.color }}>{cefr.ball}</span>
                  <span className="rp-cefr-range">/ 75</span>
                  <span className="rp-cefr-range-lbl">({cefr.range})</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── PROGRESS BAR ── */}
      <div className="rp-progress-section">
        <div className="rp-progress-header">
          <span>Score</span>
          <span style={{ color, fontWeight: 600 }}>{score}/{total}</span>
        </div>
        <div className="rp-progress-track">
          <div className="rp-progress-fill" style={{ width: `${percent}%`, background: color }} />
        </div>
      </div>

      {/* ── ANSWER SHEET ── */}
      <div className="rp-sheet-section">
        <div className="rp-sheet-header">
          <span className="rp-sheet-title">Answer Sheet</span>
          <div className="rp-sheet-controls">
            <button
              className={`rp-ctrl-btn ${showCorrect ? 'on' : ''}`}
              onClick={() => setShowCorrect(v => !v)}
            >
              <div className={`rp-toggle-track ${showCorrect ? 'on' : ''}`}>
                <div className="rp-toggle-thumb" />
              </div>
              Show Correct Answers
            </button>
            <button
              className={`rp-expl-btn ${showExpl ? 'on' : ''}`}
              onClick={() => setShowExpl(v => !v)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {showExpl ? 'Hide' : 'Show'} Explanations
            </button>
          </div>
        </div>

        <div className="rp-grid">
          {allResults.map((r, i) => (
            <div key={i} className={`rp-item ${r.is_correct ? 'ok' : 'err'}`}>
              <div className="rp-item-row">
                <div className={`rp-badge ${r.is_correct ? 'ok' : 'err'}`}>
                  {r.is_correct ? '✓' : '✗'}
                </div>
                <span className="rp-qnum">Q{r.question_number}</span>
                <div className="rp-answers">
                  <span className={`rp-user-ans ${!r.is_correct ? 'struck' : 'right'}`}>
                    {r.user_answer || <em style={{ color: '#ccc' }}>—</em>}
                  </span>
                  {!r.is_correct && showCorrect && (
                    <span className="rp-correct-ans">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0f6e56" strokeWidth="3">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                      {r.correct_answer}
                    </span>
                  )}
                </div>
              </div>
              {showExpl && r.explanation && (
                <div className="rp-expl">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#92400e" stroke="none">
                    <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                  <span>{r.explanation}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── FEEDBACK ── */}
      <div className="rp-feedback-section">
        <h3 className="rp-feedback-title">Leave Feedback</h3>
        <p className="rp-feedback-sub">Help us improve this test</p>

        {feedbackSent ? (
          <div className="rp-feedback-sent">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f6e56" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Feedback yuborildi! Admin tasdiqlashini kuting.
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 24, color: star <= rating ? '#f5a623' : '#d4d4d4',
                    padding: '0 2px', transition: 'color 0.15s',
                  }}
                >★</button>
              ))}
            </div>
            <textarea
              className="rp-feedback-input"
              placeholder="Platformamiz haqida fikringizni yozing..."
              value={feedback}
              onChange={e => { setFeedback(e.target.value); setFeedbackError(''); }}
              rows={4}
            />
            {feedbackError && (
              <p style={{ color: '#dc2626', fontSize: 13, margin: '4px 0 8px' }}>{feedbackError}</p>
            )}
            <button
              className="rp-feedback-btn"
              onClick={handleFeedback}
              disabled={submitting}
              style={{ opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? 'Yuborilmoqda...' : 'Submit Feedback'}
            </button>
          </>
        )}
      </div>

      {/* ── BOTTOM ACTIONS ── */}
      <div className="rp-bottom-actions">
        <button
          className="rp-bot-btn"
          onClick={() => window.location.href = 'https://multix-frontend-production.up.railway.app/Pages/dashboard.html'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
          Back to Home
        </button>
        <button
          className="rp-bot-btn"
          onClick={() => window.location.href = 'https://multix-frontend-production.up.railway.app/Pages/dashboard.html'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          Reading Tests
        </button>
        <button
          className="rp-bot-btn primary"
          onClick={() => window.location.reload()}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 .49-3"/>
          </svg>
          Try Again
        </button>
      </div>

    </div>
  );
}
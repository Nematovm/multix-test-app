import React, { useState, useEffect, useRef, useCallback } from 'react';
import PassageRenderer, { 
  MatchingRenderer, HeadingMatchRenderer, ReadingMCQRenderer, 
  ReadingMixedRenderer, ListeningMCQRenderer, ListeningFITBRenderer,
  ListeningMatchingRenderer,   // ← QO'SHILDI
  ListeningMapRenderer, 
  renderWithHighlights 
} from '../components/PassageRenderer';
import ResultPanel from '../components/ResultPanel';
import NotePanel from '../components/NotePanel';
import './TestPage.css';
import { useParams } from 'react-router-dom';


const API_BASE      = process.env.REACT_APP_API_URL || 'https://valiant-expression-production-a4f5.up.railway.app';
const DASHBOARD_URL = 'https://multx.uz/Pages/dashboard.html';

function calcScore(parts, userAnswers) {
  let correct = 0, total = 0;
  parts.forEach(part => {
    if (part.type === 'reading-mixed') {
      (part.question_groups || []).forEach(group => {
        if (group.type === 'fitb') {
          (group.questions || []).forEach(q => {
            total++;
            const user = (userAnswers[q.id] || '').toLowerCase().trim();
            const corr = (q.correctAnswer || '').toLowerCase().trim();
            if (user === corr) correct++;
          });
        }
        if (group.type === 'mcq') {
          (group.questions || []).forEach(q => {
            total++;
            const corr = (part.answers?.[q.id] || '').toUpperCase();
            const user = (userAnswers[q.id] || '').toUpperCase();
            if (user === corr) correct++;
          });
        }
      });
      return;
    }
    if (part.type === 'reading-mcq') {
      const groups = part.question_groups || [{ questions: part.questions || [] }];
      groups.forEach(group => {
        (group.questions || []).forEach(q => {
          total++;
          const corr = (part.answers?.[q.id] || '').toUpperCase();
          const user = (userAnswers[q.id] || '').toUpperCase();
          if (user === corr) correct++;
        });
      });
      return;
    }
    if (part.type === 'matching') {
      (part.questions || []).forEach(q => {
        total++;
        const corr = (part.answers?.[q.id] || '').toUpperCase();
        const user = (userAnswers[q.id] || '').toUpperCase();
        if (user === corr) correct++;
      });
      return;
    }
    if (part.type === 'heading-match') {
      (part.paragraphs || []).forEach(para => {
        total++;
        const corr = (part.answers?.[para.id] || '').toUpperCase();
        const user = (userAnswers[para.id] || '').toUpperCase();
        if (user === corr) correct++;
      });
      return;
    }
    if (part.type === 'listening-mcq') {
      (part.questions || []).forEach(q => {
        total++;
        const corr = (part.answers?.[q.id] || '').toUpperCase();
        const user = (userAnswers[q.id] || '').toUpperCase();
        if (user === corr) correct++;
      });
      return;
    }
    if (part.type === 'listening-fitb') {
  Object.entries(part.answers || {}).forEach(([id, corr]) => {
    total++;
    const user = (userAnswers[id] || '').toLowerCase().trim();
    if (user === corr.toLowerCase().trim()) correct++;
  });
  return;
}
    if (part.type === 'listening-matching') {
      (part.speakers || []).forEach(sp => {
        total++;
        const corr = (part.answers?.[sp.id] || '').toUpperCase();
        const user = (userAnswers[sp.id] || '').toUpperCase();
        if (user === corr) correct++;
      });
      return;
    }
    if (part.type === 'listening-map') {
      (part.questions || []).forEach(q => {
        total++;
        const corr = (part.answers?.[q.id] || '').toUpperCase();
        const user = (userAnswers[q.id] || '').toUpperCase();
        if (user === corr) correct++;
      });
      return;
    }
    if (part.answers) {
      Object.entries(part.answers).forEach(([id, corr]) => {
        total++;
        const user = (userAnswers[id] || '').toLowerCase().trim();
        if (user === corr.toLowerCase().trim()) correct++;
      });
    }
  });
  return { correct, total };
}

// ── Audio Player Component ──
function AudioPlayer({ audioUrl, onTimeUpdate, autoPlay }) {
  const audioRef  = useRef(null);
  const [playing,     setPlaying]     = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration,    setDuration]    = useState(0);

useEffect(() => {
  if (autoPlay && audioRef.current) {
    // Kichik delay — DOM tayyor bo'lishi uchun
    const timer = setTimeout(() => {
      audioRef.current?.play()
        .then(() => setPlaying(true))
        .catch(err => console.warn('Audio play failed:', err));
    }, 100);
    return () => clearTimeout(timer);
  }
}, [autoPlay]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else         { audio.play().catch(() => {}); setPlaying(true); }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = pct * duration;
  };

  const fmt = (s) => {
    const m   = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="tp-audio-player">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={e => {
          const t = e.target.currentTime;
          setCurrentTime(t);
          onTimeUpdate && onTimeUpdate(t);
        }}
        onLoadedMetadata={e => setDuration(e.target.duration)}
        onEnded={() => setPlaying(false)}
      />
      <button className="tp-audio-play-btn" onClick={togglePlay}>
        {playing ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1"/>
            <rect x="14" y="4" width="4" height="16" rx="1"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21"/>
          </svg>
        )}
      </button>
      <span className="tp-audio-time">{fmt(currentTime)}</span>
      <div className="tp-audio-track" onClick={handleSeek}>
        <div className="tp-audio-fill" style={{ width: `${pct}%` }} />
        <div className="tp-audio-thumb" style={{ left: `${pct}%` }} />
      </div>
      <span className="tp-audio-time">{fmt(duration)}</span>
    </div>
  );
}

// ── Audio Modal Component ──
function AudioModal({ onPlay }) {
  return (
    <div className="tp-audio-modal-overlay">
      <div className="tp-audio-modal">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="white" style={{ marginBottom: 16 }}>
          <path d="M12 3a9 9 0 1 0 0 18A9 9 0 0 0 12 3zm-1 13V8l6 4-6 4z"/>
        </svg>
        <p style={{ color: 'white', fontSize: 15, textAlign: 'center', marginBottom: 8, maxWidth: 420, lineHeight: 1.5 }}>
          You will be listening to an audio clip during this test.<br/>
          You will not be permitted to pause or rewind the audio while answering the questions.
        </p>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 24 }}>
          To continue, click Play.
        </p>
        <button className="tp-audio-modal-play-btn" onClick={onPlay}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21"/>
          </svg>
          Play
        </button>
      </div>
    </div>
  );
}

export default function TestPage() {
  const { id } = useParams();
  const [testData,        setTestData]        = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [currentPart,     setCurrentPart]     = useState(0);
  const [answers,         setAnswers]         = useState({});
  const [submitted,       setSubmitted]       = useState(false);
  const [timeLeft,        setTimeLeft]        = useState(0);
  const [startTime,       setStartTime]       = useState(null);
  const [started,         setStarted]         = useState(false);
  const [highlights,      setHighlights]      = useState([]);
  const [showNotePanel,   setShowNotePanel]   = useState(false);
  const [activeHighlight, setActiveHighlight] = useState(null);
  const [showToolbar,     setShowToolbar]     = useState(false);
  const [toolbarPos,      setToolbarPos]      = useState({ x: 0, y: 0 });
  const [selectedText,    setSelectedText]    = useState('');
  const [attemptId,       setAttemptId]       = useState(null);
  const [audioTime,       setAudioTime]       = useState(0);
  // ── Audio modal states ──
  const [showAudioModal,  setShowAudioModal]  = useState(false);
  const [audioStarted,    setAudioStarted]    = useState(false);
  const passageRef = useRef(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken  = urlParams.get('token');
    if (urlToken) {
      localStorage.setItem('cp_token', urlToken);
      return;
    }
    if (!localStorage.getItem('cp_token')) {
      window.location.href = 'https://multx.uz/Pages/auth.html';
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchTestData = async () => {
      setLoading(true); setError(null);
      try {
        const token   = localStorage.getItem('cp_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const isListeningPage = window.location.pathname.startsWith('/listening');
        const endpoint = isListeningPage
            ? `${API_BASE}/admin/listening-tests/${id}/json-data`
            : `${API_BASE}/admin/tests/${id}/json-data`;
        const res = await fetch(endpoint, { headers });
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            window.location.href = 'https://multx.uz/Pages/auth.html';
            return;
          }
          throw new Error(
            res.status === 404
              ? 'Test topilmadi yoki JSON fayl yuklanmagan'
              : `Server xatosi: ${res.status}`
          );
        }
        const data = await res.json();
        setTestData(data);
        setTimeLeft((data.duration || 20) * 60);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTestData();
  }, [id]);

  useEffect(() => {
    if (!started || submitted || !testData) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [started, submitted, timeLeft, testData]);

  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest('.tp-sel-toolbar')) setShowToolbar(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMouseUp = useCallback((e) => {
    if (submitted) return;
    if (e.target.tagName === 'SELECT' || e.target.tagName === 'OPTION') return;
    if (e.target.closest('button')) return;
    setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) { setShowToolbar(false); return; }
      const text  = sel.toString().trim();
      const range = sel.getRangeAt(0);
      const rect  = range.getBoundingClientRect();
      setSelectedText(text);
      setToolbarPos({ x: rect.left + rect.width / 2, y: rect.top - 10 });
      setShowToolbar(true);
    }, 10);
  }, [submitted]);

  const applyHighlight = (color) => {
    if (!selectedText) return;
    setHighlights(prev => [...prev, { id: Date.now(), text: selectedText, color, note: '' }]);
    setShowToolbar(false);
    window.getSelection()?.removeAllRanges();
  };

  const openNoteForHighlight = () => {
    const newId = Date.now();
    if (selectedText) setHighlights(prev => [...prev, { id: newId, text: selectedText, color: '#fef08a', note: '' }]);
    setActiveHighlight(newId);
    setShowNotePanel(true);
    setShowToolbar(false);
    window.getSelection()?.removeAllRanges();
  };

  const saveNote        = (hId, txt) => setHighlights(prev => prev.map(h => h.id === hId ? { ...h, note: txt } : h));
  const deleteHighlight = (hId) => {
    setHighlights(prev => prev.filter(h => h.id !== hId));
    if (activeHighlight === hId) { setShowNotePanel(false); setActiveHighlight(null); }
  };

  const goBack = () => { window.location.href = DASHBOARD_URL; };

  // ── Start Test bosganda: listening bo'lsa modal, aks holda to'g'ridan boshlash ──
  const handleStartTest = () => {
    setStarted(true);
    setStartTime(Date.now());
    const isListeningPage = window.location.pathname.startsWith('/listening');
    if (isListeningPage && testData) {
      const hasAudio = testData.audio_url || (testData.parts || []).some(p => p.audio_url);
      if (hasAudio) {
        setShowAudioModal(true);
        return;
      }
    }
  };

  // ── Modal "Play" bosganda ──
  const handleAudioModalPlay = () => {
    setShowAudioModal(false);
    setAudioStarted(true);
  };

  const handleSubmit = useCallback(async (currentAnswers) => {
    const finalAnswers = currentAnswers || answers;
    setSubmitted(true);
    if (!testData) return;
    const { correct, total } = calcScore(testData.parts, finalAnswers);
    const percent   = total > 0 ? Math.round((correct / total) * 100 * 10) / 10 : 0;
    const timeSpent = startTime ? Math.round((Date.now() - startTime) / 1000) : null;
    const token     = localStorage.getItem('cp_token');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          test_id:            parseInt(id),
          test_name:          testData.title || testData.name || 'Test',
          test_section:       testData.section || 'reading',
          score:              correct,
          total:              total,
          percent:            percent,
          time_spent_seconds: timeSpent,
          user_answers:       finalAnswers,
        }),
      });
      if (res.ok) { const data = await res.json(); setAttemptId(data.id); }
    } catch (err) {
      console.error('Attempt saqlashda xato:', err);
    }
  }, [answers, testData, id, startTime]);

  if (loading) return (
    <div className="tp-loading">
      <div className="tp-spinner" />
      <span>Test yuklanmoqda...</span>
    </div>
  );

  if (error) return (
    <div className="tp-loading">
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" style={{ marginBottom: 16 }}>
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8"  x2="12"    y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p style={{ color: '#ef4444', marginBottom: 8 }}>{error}</p>
        <button onClick={goBack} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #d1d5db', cursor: 'pointer', background: 'transparent' }}>
          Orqaga qaytish
        </button>
      </div>
    </div>
  );

  if (!testData) return null;

  const parts          = testData.parts;
  const part           = parts[currentPart];
  const isListening    = testData.section === 'listening';
  const isMatching     = part.type === 'matching';
  const isHeadingMatch = part.type === 'heading-match';
  const isReadingMCQ   = part.type === 'reading-mcq';
  const isReadingMixed = part.type === 'reading-mixed';
  const isListeningMCQ = part.type === 'listening-mcq';
  const isListeningFITB = part.type === 'listening-fitb';
  const isListeningMatching = part.type === 'listening-matching';
  const isListeningMap = part.type === 'listening-map';

  const formatTime = (s) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const handleAnswer = (qid, val) => setAnswers(p => ({ ...p, [qid]: val }));

  const getPartAnswerKeys = (p) => {
    if (p.type === 'matching')      return (p.questions  || []).map(q => q.id);
    if (p.type === 'heading-match') return (p.paragraphs || []).map(para => para.id);
    if (p.type === 'listening-mcq') return (p.questions  || []).map(q => q.id);
    if (p.type === 'listening-fitb') return Object.keys(p.answers || {});
    if (p.type === 'listening-matching') return (p.speakers || []).map(sp => sp.id);
    if (p.type === 'listening-map') return (p.questions || []).map(q => q.id);
    if (p.type === 'reading-mcq') {
      if (p.question_groups) return p.question_groups.flatMap(g => (g.questions || []).map(q => q.id));
      return (p.questions || []).map(q => q.id);
    }
    if (p.type === 'reading-mixed') {
      return (p.question_groups || []).flatMap(g => (g.questions || []).map(q => q.id));
    }
    return p.answers ? Object.keys(p.answers) : [];
  };

  const answeredCount  = Object.keys(answers).filter(k => answers[k]).length;
  const totalQuestions = parts.reduce((s, p) => s + getPartAnswerKeys(p).length, 0);
  const progress       = totalQuestions ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const isLow          = timeLeft < 300;
  const currentAudioUrl = part.audio_url || testData.audio_url || null;

  return (
    <div className="tp-root">

      {/* ── AUDIO MODAL ── */}
      {showAudioModal && currentAudioUrl && (
        <AudioModal onPlay={handleAudioModalPlay} />
      )}

      {/* ── HEADER ── */}
      <header className="tp-header">
        <button className="tp-back" onClick={goBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </button>

        <div className="tp-header-center">
          <span className="tp-test-name">{testData.title}</span>
          {/* Listening + audioStarted + audio bor bo'lsa — player o'rtada */}
{isListening && audioStarted && !submitted && currentAudioUrl ? (
  <AudioPlayer key={currentAudioUrl} audioUrl={currentAudioUrl} onTimeUpdate={setAudioTime} autoPlay={audioStarted} />
) : (
            <>
              <div className="tp-progress-bar">
                <div className="tp-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="tp-progress-text">{answeredCount}/{totalQuestions}</span>
            </>
          )}
        </div>

        <div className={`tp-timer ${isLow ? 'low' : ''}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          {formatTime(timeLeft)}
        </div>

        {!started ? (
          <button className="tp-btn-start" onClick={handleStartTest}>
            Start Test
          </button>
        ) : !submitted ? (
          <button className="tp-btn-submit" onClick={() => handleSubmit(answers)}>Submit</button>
        ) : null}

        {!submitted && (
          <button
            className={`tp-btn-note ${showNotePanel ? 'active' : ''}`}
            onClick={() => setShowNotePanel(v => !v)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            {highlights.some(h => h.note) && <span className="tp-note-badge" />}
          </button>
        )}
      </header>

      {/* ── RESULT yoki TEST ── */}
      {submitted ? (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <ResultPanel
            parts={parts}
            userAnswers={answers}
            testId={parseInt(id)}
            attemptId={attemptId}
            isListening={isListening}
          />
        </div>
      ) : (
        <div className="tp-body">
          <aside className="tp-sidebar">
            <div className="tp-sidebar-label">Parts</div>
            {parts.map((p, i) => {
              const keys = getPartAnswerKeys(p);
              const done = keys.filter(k => answers[k]).length;
              return (
                <button
                  key={i}
                  className={`tp-part-btn ${currentPart === i ? 'active' : ''}`}
                  onClick={() => setCurrentPart(i)}
                >
                  <span className="tp-part-num">Part {p.part_number}</span>
                  <span className="tp-part-progress">{done}/{keys.length}</span>
                </button>
              );
            })}
            {highlights.length > 0 && (
              <div className="tp-highlight-list">
                <div className="tp-sidebar-label" style={{ marginTop: 20 }}>Highlights</div>
                {highlights.map(h => (
                  <div
                    key={h.id}
                    className="tp-hl-item"
                    style={{ borderLeft: `3px solid ${h.color === '#fef08a' ? '#eab308' : h.color}` }}
                    onClick={() => { setActiveHighlight(h.id); setShowNotePanel(true); }}
                  >
                    <span className="tp-hl-text">
                      "{h.text.slice(0, 30)}{h.text.length > 30 ? '…' : ''}"
                    </span>
                    {h.note && <span className="tp-hl-note-icon">📝</span>}
                  </div>
                ))}
              </div>
            )}
          </aside>

          <main className="tp-main" onMouseUp={handleMouseUp} ref={passageRef}>
            <div className="tp-part-header">
              <div className="tp-part-badge">
                {isListening && '🎧 '}Part {part.part_number}
              </div>
<p className="tp-instruction">
  {renderWithHighlights(part.instruction, highlights)}
</p>
            </div>
            <div className="tp-passage-card">
  {isListeningMap ? (
    <ListeningMapRenderer
      part={part} answers={answers} onAnswer={handleAnswer}
      submitted={submitted} highlights={highlights}
    />
  ) : isListeningMatching ? (
    <ListeningMatchingRenderer
      part={part} answers={answers} onAnswer={handleAnswer}
      submitted={submitted} highlights={highlights}
    />
  ) : isListeningFITB ? (
  <ListeningFITBRenderer
    part={part} answers={answers} onAnswer={handleAnswer}
    submitted={submitted} highlights={highlights}
  />
) : isListeningMCQ ? (
  <ListeningMCQRenderer
    part={part} answers={answers} onAnswer={handleAnswer}
    submitted={submitted} highlights={highlights}
    audioTime={audioTime}
  />
) : isMatching ? (
  <MatchingRenderer part={part} answers={answers} onAnswer={handleAnswer} submitted={submitted} highlights={highlights} />
) : isHeadingMatch ? (
  <HeadingMatchRenderer part={part} answers={answers} onAnswer={handleAnswer} submitted={submitted} highlights={highlights} />
) : isReadingMCQ ? (
  <ReadingMCQRenderer part={part} answers={answers} onAnswer={handleAnswer} submitted={submitted} highlights={highlights} />
) : isReadingMixed ? (
  <ReadingMixedRenderer part={part} answers={answers} onAnswer={handleAnswer} submitted={submitted} highlights={highlights} />
) : (
  <PassageRenderer passage={part.passage} answers={answers} onAnswer={handleAnswer} submitted={submitted} highlights={highlights} />
)}
            </div>
          </main>

          {showNotePanel && (
            <NotePanel
              highlights={highlights}
              activeHighlight={activeHighlight}
              setActiveHighlight={setActiveHighlight}
              saveNote={saveNote}
              deleteHighlight={deleteHighlight}
              onClose={() => setShowNotePanel(false)}
            />
          )}
        </div>
      )}

      {showToolbar && (
        <div className="tp-sel-toolbar" style={{ left: toolbarPos.x, top: toolbarPos.y }}>
          <button onClick={() => applyHighlight('#fef08a')}><span style={{ background: '#fef08a' }} /></button>
          <button onClick={() => applyHighlight('#bbf7d0')}><span style={{ background: '#bbf7d0' }} /></button>
          <button onClick={() => applyHighlight('#bfdbfe')}><span style={{ background: '#bfdbfe' }} /></button>
          <button onClick={() => applyHighlight('#fecaca')}><span style={{ background: '#fecaca' }} /></button>
          <div className="tp-toolbar-sep" />
          <button className="tp-toolbar-note" onClick={openNoteForHighlight}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Note
          </button>
        </div>
      )}

      {!submitted && started && (
        <footer className="tp-footer">
          {parts.map((p, i) => (
            <button key={i} className={`tp-fp ${currentPart === i ? 'active' : ''}`} onClick={() => setCurrentPart(i)}>
              Part {p.part_number}
            </button>
          ))}
        </footer>
      )}
    </div>
  );
}
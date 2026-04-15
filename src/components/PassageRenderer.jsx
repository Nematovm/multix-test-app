import React from 'react';
import './PassageRenderer.css';

// ── Shared highlight helper ──
function renderWithHighlights(content, highlights) {
  if (!highlights || !highlights.length) return content;
  let parts = [{ type: 'text', content }];
  highlights.forEach(h => {
    const newParts = [];
    parts.forEach(part => {
      if (part.type !== 'text') { newParts.push(part); return; }
      const idx = part.content.indexOf(h.text);
      if (idx === -1) { newParts.push(part); return; }
      if (idx > 0) newParts.push({ type: 'text', content: part.content.slice(0, idx) });
      newParts.push({ type: 'highlight', content: h.text, color: h.color, id: h.id });
      const after = part.content.slice(idx + h.text.length);
      if (after) newParts.push({ type: 'text', content: after });
    });
    parts = newParts;
  });
  return parts.map((p, i) =>
    p.type === 'highlight'
      ? <mark key={i} style={{ background: p.color, borderRadius: '3px', padding: '1px 0' }}>{p.content}</mark>
      : <span key={i}>{p.content}</span>
  );
}

// ── MATCHING RENDERER ──
export function MatchingRenderer({ part, answers, onAnswer, submitted, highlights = [] }) {
  const options   = part.options   || [];
  const questions = part.questions || [];

  return (
    <div className="matching-layout">
      <div className="matching-options-panel">
        <div className="matching-panel-title">Options</div>
        <div className="matching-options-list">
          {options.map(opt => (
            <div key={opt.key} className="matching-option-item">
              <span className="matching-opt-key">{opt.key}</span>
              <span className="matching-opt-text">
                {renderWithHighlights(opt.text, highlights)}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="matching-questions-panel">
        <div className="matching-panel-title">Questions</div>
        {questions.map(q => {
          const userAnswer = answers[q.id] || '';
          const correct    = part.answers?.[q.id] || '';
          let selectClass  = 'matching-select';
          if (submitted) {
            selectClass += userAnswer.toUpperCase() === correct.toUpperCase() ? ' correct' : ' wrong';
          }
          return (
            <div key={q.id} className="matching-question-row">
              <div className="matching-q-number">{q.number}</div>
              <div className="matching-q-text">{renderWithHighlights(q.text, highlights)}</div>
              <div className="matching-q-answer">
                <select
                  className={selectClass}
                  value={userAnswer}
                  onChange={e => onAnswer(q.id, e.target.value)}
                  disabled={submitted}
                >
                  <option value="">—</option>
                  {options.map(opt => (
                    <option key={opt.key} value={opt.key}>{opt.key}</option>
                  ))}
                </select>
                {submitted && userAnswer.toUpperCase() !== correct.toUpperCase() && (
                  <span className="matching-correct-hint">✓ {correct}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── FITB RENDERER ──
export default function PassageRenderer({ passage, answers, onAnswer, submitted, highlights = [] }) {
  return (
    <div className="passage">
      {passage.map((item, index) => {
        if (item.type === 'text') {
          return <span key={index}>{renderWithHighlights(item.content, highlights)}</span>;
        }
        if (item.type === 'input') {
          const userAnswer    = answers[item.id] || '';
          const correctAnswer = item.correctAnswer || '';
          let inputClass = 'inline-input';
          if (submitted) {
            inputClass += userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
              ? ' correct' : ' wrong';
          }
          return (
            <span key={index} className="input-wrap">
              <span className="q-number">{item.number}</span>
              <input
                type="text"
                className={inputClass}
                value={userAnswer}
                onChange={e => { const val = e.target.value; if (!val.includes(' ')) onAnswer(item.id, val); }}
                disabled={submitted}
                placeholder={`(${item.number})`}
                maxLength={30}
              />
              {submitted && userAnswer.toLowerCase().trim() !== correctAnswer.toLowerCase().trim() && (
                <span className="correct-hint">{correctAnswer}</span>
              )}
            </span>
          );
        }
        return null;
      })}
    </div>
  );
}

// ── PART 3: HEADING MATCH RENDERER ──
export function HeadingMatchRenderer({ part, answers, onAnswer, submitted, highlights = [] }) {
  const [draggedHeading, setDraggedHeading] = React.useState(null);
  const [dragOver, setDragOver]             = React.useState(null);

  const paragraphs = part.paragraphs || [];
  const headings   = part.headings   || [];
  const paraIds    = paragraphs.map(p => p.id);
  const placedKeys = paraIds.map(id => answers[id]).filter(Boolean);

  const handleChipDragStart = (e, key) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', key);
    // setTimeout — React state update drag bilan conflict qilmasligi uchun
    setTimeout(() => setDraggedHeading(key), 0);
  };

  const handlePlacedDragStart = (e, key) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', key);
    setTimeout(() => setDraggedHeading(key), 0);
  };

  const handleDragEnd = () => {
    setDraggedHeading(null);
    setDragOver(null);
  };

  const handleDragOver = (e, paraId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(paraId);
  };

  const handleDragLeave = (e, paraId) => {
    // Faqat zone dan tashqariga chiqqanda reset qilish
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setDragOver(null);
  };

  const handleDrop = (e, questionId) => {
    e.preventDefault();
    const key = e.dataTransfer.getData('text/plain');
    if (!key) return;
    // Avvalgi joydan olib tashlash
    const prevId = Object.keys(answers).find(k => answers[k] === key);
    if (prevId && prevId !== questionId) onAnswer(prevId, '');
    onAnswer(questionId, key);
    setDraggedHeading(null);
    setDragOver(null);
  };

  const handleRemove = (e, questionId) => {
    e.stopPropagation();
    if (!submitted) onAnswer(questionId, '');
  };

  const getHeadingText = (key) => {
    const h = headings.find(h => h.key === key);
    return h ? h.text : key;
  };

  const isCorrect = (qId) => {
    const correct = part.answers?.[qId] || '';
    return (answers[qId] || '').toUpperCase() === correct.toUpperCase();
  };

  return (
    <div className="p3-layout">
      <div className="p3-passage-col">
        {part.passage_title && (
          <div className="p3-passage-title">
            <h2>{part.passage_title}</h2>
            {part.passage_subtitle && <p>{part.passage_subtitle}</p>}
          </div>
        )}

        {paragraphs.map((para) => {
          const placed  = answers[para.id] || '';
          const correct = part.answers?.[para.id] || '';
          let dropClass = 'p3-drop-zone';
          if (dragOver === para.id)      dropClass += ' drag-over';
          if (submitted && placed)       dropClass += isCorrect(para.id) ? ' correct' : ' wrong';

          return (
            <div key={para.id} className="p3-paragraph-block">
              <div
                className={dropClass}
                onDragOver={e => handleDragOver(e, para.id)}
                onDragLeave={e => handleDragLeave(e, para.id)}
                onDrop={e => handleDrop(e, para.id)}
              >
                {placed ? (
                  <div
                    className={`p3-placed-heading ${submitted ? (isCorrect(para.id) ? 'correct' : 'wrong') : ''}`}
                    draggable={!submitted}
                    onDragStart={e => handlePlacedDragStart(e, placed)}
                    onDragEnd={handleDragEnd}
                  >
                    <span className="p3-heading-key">{placed}</span>
                    <span className="p3-heading-txt">{getHeadingText(placed)}</span>
                    {!submitted && (
                      <button className="p3-remove-btn" onClick={e => handleRemove(e, para.id)}>×</button>
                    )}
                    {submitted && !isCorrect(para.id) && (
                      <span className="p3-correct-hint">✓ {correct}</span>
                    )}
                  </div>
                ) : (
                  <span className="p3-drop-hint">
                    <span className="p3-q-num">{para.number}</span>
                    Drop heading here
                  </span>
                )}
              </div>
              <div className="p3-para-label">{para.label}</div>
              <p className="p3-para-text">
                {renderWithHighlights(para.text, highlights)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="p3-headings-col">
        <div className="p3-headings-title">List of Headings</div>
        <div className="p3-headings-list">
          {headings.map((h) => {
            const isPlaced   = placedKeys.includes(h.key);
            const isDragging = draggedHeading === h.key;
            return (
              <div
                key={h.key}
                className={`p3-heading-chip ${isPlaced ? 'placed' : ''} ${isDragging ? 'dragging' : ''}`}
                draggable={!submitted && !isPlaced}
                onDragStart={e => handleChipDragStart(e, h.key)}
                onDragEnd={handleDragEnd}
              >
                <span className="p3-heading-key">{h.key}</span>
                <span className="p3-heading-label">{h.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── PART 4: MCQ + TRUE/FALSE/NG RENDERER ──
export function ReadingMCQRenderer({ part, answers, onAnswer, submitted, highlights = [] }) {
  const passage  = part.passage_text     || '';
  const title    = part.passage_title    || '';
  const subtitle = part.passage_subtitle || '';
  const groups   = part.question_groups  || [{ questions: part.questions || [] }];

  const isCorrect = (qId) => {
    const correct = part.answers?.[qId] || '';
    const user    = answers[qId] || '';
    return user.toUpperCase() === correct.toUpperCase();
  };

  const renderQuestion = (q) => {
    const userAnswer = answers[q.id] || '';
    const correct    = part.answers?.[q.id] || '';

    if (q.type === 'mcq') {
      return (
        <div key={q.id} className="p4-question-block">
          <div className="p4-q-row">
            <span className="p4-q-num">{q.number}</span>
            <span className="p4-q-text">{renderWithHighlights(q.text, highlights)}</span>
          </div>
          <div className="p4-options">
            {(q.options || []).map(opt => {
              let cls = 'p4-option';
              if (submitted) {
                if (opt.key.toUpperCase() === correct.toUpperCase()) cls += ' correct';
                else if (opt.key.toUpperCase() === userAnswer.toUpperCase()) cls += ' wrong';
              } else if (userAnswer.toUpperCase() === opt.key.toUpperCase()) {
                cls += ' selected';
              }
              return (
                <button
                  key={opt.key}
                  className={cls}
                  onClick={() => !submitted && onAnswer(q.id, opt.key)}
                  disabled={submitted}
                >
                  <span className="p4-opt-key">{opt.key}</span>
                  <span className="p4-opt-text">{opt.text}</span>
                </button>
              );
            })}
          </div>
          {submitted && !isCorrect(q.id) && (
            <div className="p4-correct-hint">✓ Correct answer: {correct}</div>
          )}
        </div>
      );
    }

    if (q.type === 'tfng' || q.type === 'true-false') {
      const opts = [
        { label: 'True',      key: 'True'  },
        { label: 'False',     key: 'False' },
        { label: 'Not Given', key: 'NG'    },
      ];
      return (
        <div key={q.id} className="p4-question-block">
          <div className="p4-q-row">
            <span className="p4-q-num">{q.number}</span>
            <span className="p4-q-text">{renderWithHighlights(q.text, highlights)}</span>
          </div>
          <div className="p4-tfng-options">
            {opts.map(opt => {
              const userUp    = (userAnswer || '').toUpperCase();
              const correctUp = (correct    || '').toUpperCase();
              const optUp     = opt.key.toUpperCase();
              const optLblUp  = opt.label.toUpperCase();
              const isUserMatch    = userUp    === optUp || userUp    === optLblUp;
              const isCorrectMatch = correctUp === optUp || correctUp === optLblUp;
              let cls = 'p4-tfng-btn';
              if (submitted) {
                if (isCorrectMatch) cls += ' correct';
                else if (isUserMatch) cls += ' wrong';
              } else if (isUserMatch) {
                cls += ' selected';
              }
              return (
                <button
                  key={opt.key}
                  className={cls}
                  onClick={() => !submitted && onAnswer(q.id, opt.key)}
                  disabled={submitted}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          {submitted && !isCorrect(q.id) && (
            <div className="p4-correct-hint">✓ Correct answer: {correct}</div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="p4-layout">
      <div className="p4-passage-col">
        {title    && <div className="p4-passage-title">{title}</div>}
        {subtitle && <div className="p4-passage-subtitle">{subtitle}</div>}
        <div className="p4-passage-text">
          {renderWithHighlights(passage, highlights)}
        </div>
      </div>
      <div className="p4-questions-col">
        {groups.map((group, gi) => (
          <div key={gi} className="p4-group">
            {group.title       && <div className="p4-group-title">{group.title}</div>}
            {group.instruction && <div className="p4-group-instruction">{group.instruction}</div>}
            {(group.questions || []).map(q => renderQuestion(q))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── PART 5: READING MIXED (FITB + MCQ) RENDERER ──
export function ReadingMixedRenderer({ part, answers, onAnswer, submitted, highlights = [] }) {
  const title    = part.passage_title    || '';
  const subtitle = part.passage_subtitle || '';
  const passage  = part.passage_text     || '';
  const groups   = part.question_groups  || [];

  const isFITBCorrect = (qId, correctAnswer) => {
    const user = (answers[qId] || '').toLowerCase().trim();
    const corr = (correctAnswer || '').toLowerCase().trim();
    return user === corr;
  };

  const isMCQCorrect = (qId) => {
    const correct = part.answers?.[qId] || '';
    const user    = answers[qId] || '';
    return user.toUpperCase() === correct.toUpperCase();
  };

  const renderFITBSummary = (group) => {
    const summaryPassage = group.summary_passage || '';
    const questions      = group.questions       || [];
    const qMap = {};
    questions.forEach(q => { qMap[q.id] = q; });

    const regex = /\{(\w+)\}/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(summaryPassage)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: summaryPassage.slice(lastIndex, match.index) });
      }
      parts.push({ type: 'input', id: match[1] });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < summaryPassage.length) {
      parts.push({ type: 'text', content: summaryPassage.slice(lastIndex) });
    }

    return (
      <div className="p5-fitb-summary">
        <p className="p5-summary-text">
          {parts.map((p, i) => {
            if (p.type === 'text') return <span key={i}>{p.content}</span>;
            const q = qMap[p.id];
            if (!q) return null;
            const userAnswer    = answers[q.id] || '';
            const correctAnswer = q.correctAnswer || '';
            let cls = 'p5-inline-input';
            if (submitted) {
              cls += isFITBCorrect(q.id, correctAnswer) ? ' correct' : ' wrong';
            }
            return (
              <span key={i} className="p5-input-wrap">
                <span className="p5-q-number">{q.number}</span>
                <input
                  type="text"
                  className={cls}
                  value={userAnswer}
                  onChange={e => {
                    const val = e.target.value;
                    if (!val.includes(' ')) onAnswer(q.id, val);
                  }}
                  disabled={submitted}
                  placeholder={`(${q.number})`}
                  maxLength={30}
                />
                {submitted && !isFITBCorrect(q.id, correctAnswer) && (
                  <span className="p5-correct-hint">{correctAnswer}</span>
                )}
              </span>
            );
          })}
        </p>
      </div>
    );
  };

  const renderMCQ = (q) => {
    const userAnswer = answers[q.id] || '';
    const correct    = part.answers?.[q.id] || '';
    return (
      <div key={q.id} className="p5-mcq-block">
        <div className="p5-mcq-q-row">
          <span className="p5-mcq-num">{q.number}</span>
          <span className="p5-mcq-text">{q.text}</span>
        </div>
        <div className="p5-mcq-options">
          {(q.options || []).map(opt => {
            let cls = 'p5-mcq-option';
            if (submitted) {
              if (opt.key.toUpperCase() === correct.toUpperCase()) cls += ' correct';
              else if (opt.key.toUpperCase() === userAnswer.toUpperCase()) cls += ' wrong';
            } else if (userAnswer.toUpperCase() === opt.key.toUpperCase()) {
              cls += ' selected';
            }
            return (
              <button
                key={opt.key}
                className={cls}
                onClick={() => !submitted && onAnswer(q.id, opt.key)}
                disabled={submitted}
              >
                <span className="p5-opt-key">{opt.key}</span>
                <span className="p5-opt-text">{opt.text}</span>
              </button>
            );
          })}
        </div>
        {submitted && !isMCQCorrect(q.id) && (
          <div className="p5-mcq-hint">✓ Correct answer: {correct}</div>
        )}
      </div>
    );
  };

  return (
    <div className="p5-layout">
      <div className="p5-passage-col">
        {title    && <div className="p5-passage-title">{title}</div>}
        {subtitle && <div className="p5-passage-subtitle">{subtitle}</div>}
        <div className="p5-passage-text">
          {renderWithHighlights(passage, highlights)}
        </div>
      </div>
      <div className="p5-questions-col">
        {groups.map((group, gi) => (
          <div key={gi} className="p5-group">
            {group.title       && <div className="p5-group-title">{group.title}</div>}
            {group.instruction && <div className="p5-group-instruction">{group.instruction}</div>}
            {group.type === 'fitb' && renderFITBSummary(group)}
            {group.type === 'mcq'  && (
              <div className="p5-mcq-list">
                {(group.questions || []).map(q => renderMCQ(q))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import './NotePanel.css';

export default function NotePanel({
  highlights, activeHighlight, setActiveHighlight,
  saveNote, deleteHighlight, onClose
}) {
  const [noteText, setNoteText] = useState('');
  const active = highlights.find(h => h.id === activeHighlight);

  useEffect(() => {
    if (active) setNoteText(active.note || '');
    else setNoteText('');
  }, [activeHighlight, active]);

  const colorName = (color) => {
    const map = { '#fef08a': 'Yellow', '#bbf7d0': 'Green', '#bfdbfe': 'Blue', '#fecaca': 'Red' };
    return map[color] || 'Highlighted';
  };

  return (
    <aside className="note-panel">
      <div className="np-header">
        <span className="np-title">Notes & Highlights</span>
        <button className="np-close" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {highlights.length === 0 ? (
        <div className="np-empty">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d4d4d4" strokeWidth="1.5">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          <p>Select text in the passage to highlight or add a note.</p>
        </div>
      ) : (
        <div className="np-list">
          {highlights.map(h => (
            <div
              key={h.id}
              className={`np-item ${activeHighlight === h.id ? 'active' : ''}`}
              onClick={() => setActiveHighlight(h.id)}
            >
              <div className="np-item-header">
                <span
                  className="np-color-dot"
                  style={{ background: h.color, border: `1px solid ${h.color === '#fef08a' ? '#eab308' : 'transparent'}` }}
                />
                <span className="np-color-label">{colorName(h.color)}</span>
                <button
                  className="np-delete"
                  onClick={e => { e.stopPropagation(); deleteHighlight(h.id); }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <p className="np-excerpt">"{h.text.slice(0, 60)}{h.text.length > 60 ? '…' : ''}"</p>
              {h.note && <p className="np-note-preview">{h.note}</p>}
            </div>
          ))}
        </div>
      )}

      {active && (
        <div className="np-editor">
          <div className="np-editor-header">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2caa9a" strokeWidth="2.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Add note
          </div>
          <textarea
            className="np-textarea"
            placeholder="Type your note here..."
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            rows={4}
          />
          <button
            className="np-save"
            onClick={() => saveNote(active.id, noteText)}
          >
            Save note
          </button>
        </div>
      )}
    </aside>
  );
}
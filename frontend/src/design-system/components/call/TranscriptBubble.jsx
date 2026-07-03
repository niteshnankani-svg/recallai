import React from 'react';
import { EmotionTag } from './EmotionTag';

/** TranscriptBubble — one turn of a call transcript (agent or caller). */
export function TranscriptBubble({ from = 'agent', text, emotion, lang }) {
  const isAgent = from === 'agent';
  return (
    <div style={{ display: 'flex', justifyContent: isAgent ? 'flex-start' : 'flex-end', marginBottom: 'var(--space-3)' }}>
      <div style={{
        maxWidth: '78%', padding: '10px 16px', borderRadius: 'var(--radius-lg)',
        background: isAgent ? 'var(--surface-card)' : 'var(--accent-primary-soft)',
        boxShadow: isAgent ? 'var(--shadow-xs)' : 'none',
        borderBottomLeftRadius: isAgent ? 4 : 'var(--radius-lg)',
        borderBottomRightRadius: isAgent ? 'var(--radius-lg)' : 4,
      }}>
        <div style={{ font: 'var(--text-body-md)', color: 'var(--text-primary)', fontFamily: lang === 'hi' ? "'Noto Sans Devanagari', var(--font-body)" : 'var(--font-body)' }}>{text}</div>
        {emotion && <div style={{ marginTop: 6 }}><EmotionTag emotion={emotion} /></div>}
      </div>
    </div>
  );
}

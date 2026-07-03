import React from 'react';

const tones = {
  neutral: { bg: 'var(--status-neutral-soft)', fg: 'var(--status-neutral)' },
  positive: { bg: 'var(--status-positive-soft)', fg: 'var(--status-positive)' },
  attention: { bg: 'var(--status-attention-soft)', fg: 'var(--status-attention)' },
  critical: { bg: 'var(--status-critical-soft)', fg: 'var(--status-critical)' },
};

/** Badge — small status pill (call state, environment key checks, etc). */
export function Badge({ children, tone = 'neutral', dot = false, style }) {
  const t = tones[tone] || tones.neutral;
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: t.bg, color: t.fg,
        font: 'var(--text-label)', letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase',
        padding: '4px 10px', borderRadius: 'var(--radius-full)',
        ...style,
      }}
    >
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.fg }} />}
      {children}
    </span>
  );
}

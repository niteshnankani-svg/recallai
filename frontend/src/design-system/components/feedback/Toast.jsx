import React from 'react';
import { Icon } from '../core/Icon';

const tones = {
  neutral: { bg: 'var(--ink-900)', fg: 'var(--sand-50)', icon: 'info' },
  positive: { bg: 'var(--sage-700)', fg: '#fff', icon: 'check' },
  critical: { bg: 'var(--status-critical)', fg: '#fff', icon: 'alert-triangle' },
};

/** Toast — transient bottom-corner notice. */
export function Toast({ tone = 'neutral', children, onClose }) {
  const t = tones[tone] || tones.neutral;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: t.bg, color: t.fg, borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-md)', padding: '12px 16px', font: 'var(--text-body-md)',
      fontFamily: 'var(--font-body)', minWidth: 240, maxWidth: 360,
    }}>
      <Icon name={t.icon} size={16} color={t.fg} />
      <div style={{ flex: 1 }}>{children}</div>
      {onClose && <Icon name="x" size={14} color={t.fg} style={{ cursor: 'pointer', opacity: 0.7 }} onClick={onClose} />}
    </div>
  );
}

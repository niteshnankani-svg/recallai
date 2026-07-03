import React from 'react';
import { IconButton } from '../core/IconButton';

/** Dialog — centered modal over a warm scrim. */
export function Dialog({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--surface-overlay)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      fontFamily: 'var(--font-body)',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface-card)', borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)', padding: 'var(--space-8)', width: 420, maxWidth: '90vw',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <div style={{ font: 'var(--text-title-lg)', color: 'var(--text-primary)' }}>{title}</div>
          <IconButton icon="x" label="Close" size="sm" onClick={onClose} />
        </div>
        <div style={{ font: 'var(--text-body-md)', color: 'var(--text-secondary)' }}>{children}</div>
        {footer && <div style={{ marginTop: 'var(--space-6)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>{footer}</div>}
      </div>
    </div>
  );
}

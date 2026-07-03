import React from 'react';

/** Card — the base surface for grouped content: white on the warm sand app background. */
export function Card({ children, padding = 'var(--space-6)', style, tinted = false, ...rest }) {
  return (
    <div
      style={{
        background: tinted ? 'var(--surface-card-tint)' : 'var(--surface-card)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        padding,
        boxSizing: 'border-box',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

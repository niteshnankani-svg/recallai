import React from 'react';

export function Th({ children }) {
  return <th style={{ textAlign: 'left', font: 'var(--text-label)', letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', color: 'var(--text-tertiary)', padding: '8px 12px', borderBottom: '1.5px solid var(--border-default)' }}>{children}</th>;
}

export function Td({ children, style }) {
  return <td style={{ font: 'var(--text-body-sm)', color: 'var(--text-primary)', padding: '9px 12px', borderBottom: '1px solid var(--border-subtle)', ...style }}>{children}</td>;
}

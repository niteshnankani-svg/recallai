import React from 'react';

/** Switch — on/off toggle. */
export function Switch({ checked = false, onChange, label, disabled = false }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-body)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}>
      <span
        onClick={() => !disabled && onChange && onChange(!checked)}
        style={{
          width: 40, height: 24, borderRadius: 'var(--radius-full)',
          background: checked ? 'var(--accent-primary)' : 'var(--ink-100)',
          position: 'relative', transition: 'background-color var(--duration-base) var(--ease-standard)',
          flexShrink: 0,
        }}
      >
        <span style={{
          position: 'absolute', top: 3, left: checked ? 19 : 3,
          width: 18, height: 18, borderRadius: '50%', background: '#fff',
          boxShadow: 'var(--shadow-xs)', transition: 'left var(--duration-base) var(--ease-gentle)',
        }} />
      </span>
      {label && <span style={{ font: 'var(--text-body-md)', color: 'var(--text-primary)' }}>{label}</span>}
    </label>
  );
}

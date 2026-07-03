import React from 'react';
import { Icon } from '../core/Icon';

/** Select — native select styled to match Input. */
export function Select({ label, value, onChange, options = [], style }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'var(--font-body)', ...style }}>
      {label && <span style={{ font: 'var(--text-label)', letterSpacing: 'var(--tracking-label)', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{label}</span>}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <select
          value={value}
          onChange={onChange}
          style={{
            appearance: 'none', WebkitAppearance: 'none',
            width: '100%', background: 'var(--surface-card)', boxShadow: 'inset 0 0 0 1.5px var(--border-default)',
            borderRadius: 'var(--radius-md)', border: 'none', padding: '10px 36px 10px 14px',
            font: 'var(--text-body-md)', color: 'var(--text-primary)', cursor: 'pointer',
          }}
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <Icon name="chevron-down" size={16} color="var(--text-tertiary)" style={{ position: 'absolute', right: 12, pointerEvents: 'none' }} />
      </div>
    </label>
  );
}

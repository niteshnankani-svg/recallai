import React from 'react';
import { Icon } from '../core/Icon';

/** Input — single-line text field. */
export function Input({ label, placeholder, value, onChange, icon, type = 'text', disabled = false, style }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'var(--font-body)', ...style }}>
      {label && <span style={{ font: 'var(--text-label)', letterSpacing: 'var(--tracking-label)', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{label}</span>}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)',
        borderRadius: 'var(--radius-md)',
        boxShadow: focused ? 'var(--shadow-focus), inset 0 0 0 1.5px var(--border-focus)' : 'inset 0 0 0 1.5px var(--border-default)',
        padding: '10px 14px',
        transition: 'box-shadow var(--duration-fast) var(--ease-standard)',
      }}>
        {icon && <Icon name={icon} size={16} color="var(--text-tertiary)" />}
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ border: 'none', outline: 'none', background: 'transparent', font: 'var(--text-body-md)', color: 'var(--text-primary)', width: '100%' }}
        />
      </div>
    </label>
  );
}

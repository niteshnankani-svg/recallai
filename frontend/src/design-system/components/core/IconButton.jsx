import React from 'react';
import { Icon } from './Icon';

const sizeMap = { sm: 32, md: 40, lg: 52 };
const iconSize = { sm: 15, md: 18, lg: 22 };

function variantStyle(variant, disabled) {
  if (disabled) return { background: 'var(--ink-100)', color: 'var(--text-disabled)' };
  switch (variant) {
    case 'filled': return { background: 'var(--accent-primary)', color: '#fff' };
    case 'danger': return { background: 'var(--status-critical)', color: '#fff' };
    case 'soft': return { background: 'var(--accent-primary-soft)', color: 'var(--accent-primary-hover)' };
    case 'ghost':
    default: return { background: 'transparent', color: 'var(--text-primary)', boxShadow: 'inset 0 0 0 1.5px var(--border-default)' };
  }
}

/** IconButton — round icon-only control (mute, keypad, end-call, etc). */
export function IconButton({ icon, label, variant = 'ghost', size = 'md', disabled = false, onClick, style }) {
  const [pressed, setPressed] = React.useState(false);
  const d = sizeMap[size];
  return (
    <button
      aria-label={label || icon}
      title={label}
      disabled={disabled}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onClick={onClick}
      style={{
        width: d, height: d, borderRadius: '50%', border: 'none', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform var(--duration-fast) var(--ease-standard), opacity var(--duration-fast) var(--ease-standard)',
        transform: pressed && !disabled ? 'scale(0.92)' : 'scale(1)',
        opacity: pressed && !disabled ? 0.9 : 1,
        ...variantStyle(variant, disabled),
        ...style,
      }}
    >
      <Icon name={icon} size={iconSize[size]} />
    </button>
  );
}

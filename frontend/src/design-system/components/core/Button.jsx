import React from 'react';
import { Icon } from './Icon';

const base = {
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 15,
  border: 'none',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  transition: 'background-color var(--duration-fast) var(--ease-standard), transform var(--duration-fast) var(--ease-standard), opacity var(--duration-fast) var(--ease-standard)',
};

const sizes = {
  sm: { padding: '8px 14px', fontSize: 13, borderRadius: 'var(--radius-sm)' },
  md: { padding: '11px 20px', fontSize: 15 },
  lg: { padding: '14px 26px', fontSize: 16, borderRadius: 'var(--radius-lg)' },
};

function variantStyle(variant, disabled) {
  if (disabled) {
    return { background: 'var(--ink-100)', color: 'var(--text-disabled)' };
  }
  switch (variant) {
    case 'secondary':
      return { background: 'var(--surface-card)', color: 'var(--text-primary)', boxShadow: 'inset 0 0 0 1.5px var(--border-default)' };
    case 'ghost':
      return { background: 'transparent', color: 'var(--text-primary)' };
    case 'destructive':
      return { background: 'var(--status-critical)', color: '#fff' };
    case 'primary':
    default:
      return { background: 'var(--accent-primary)', color: '#fff' };
  }
}

/** Button — primary call-to-action through quiet ghost actions. */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  disabled = false,
  onClick,
  style,
  ...rest
}) {
  const [pressed, setPressed] = React.useState(false);
  const vStyle = variantStyle(variant, disabled);
  return (
    <button
      disabled={disabled}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onClick={onClick}
      style={{
        ...base,
        ...sizes[size],
        ...vStyle,
        transform: pressed && !disabled ? 'scale(0.97)' : 'scale(1)',
        opacity: pressed && !disabled ? 0.92 : 1,
        ...style,
      }}
      {...rest}
    >
      {icon && iconPosition === 'left' && <Icon name={icon} size={size === 'sm' ? 15 : 17} />}
      {children}
      {icon && iconPosition === 'right' && <Icon name={icon} size={size === 'sm' ? 15 : 17} />}
    </button>
  );
}

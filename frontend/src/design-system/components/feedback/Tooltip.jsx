import React from 'react';

/** Tooltip — hover label, small dark pill above the trigger. */
export function Tooltip({ label, children }) {
  const [show, setShow] = React.useState(false);
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span style={{
          position: 'absolute', bottom: '120%', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--ink-900)', color: 'var(--sand-50)', padding: '5px 10px',
          borderRadius: 'var(--radius-sm)', font: 'var(--text-body-sm)', fontFamily: 'var(--font-body)',
          whiteSpace: 'nowrap', boxShadow: 'var(--shadow-sm)', pointerEvents: 'none',
        }}>
          {label}
        </span>
      )}
    </span>
  );
}

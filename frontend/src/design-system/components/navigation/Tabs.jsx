import React from 'react';

/** Tabs — simple underline tab nav (used across admin panel screens). */
export function Tabs({ tabs = [], active, onChange, style }) {
  return (
    <div style={{ display: 'flex', gap: 4, borderBottom: '1.5px solid var(--border-default)', fontFamily: 'var(--font-body)', ...style }}>
      {tabs.map(t => {
        const isActive = t.value === active;
        return (
          <button
            key={t.value}
            onClick={() => onChange && onChange(t.value)}
            style={{
              border: 'none', background: 'transparent', cursor: 'pointer',
              padding: '10px 16px', font: isActive ? 'var(--text-title-sm)' : 'var(--text-body-md)',
              color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
              borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
              marginBottom: -1.5,
              transition: 'color var(--duration-fast) var(--ease-standard)',
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

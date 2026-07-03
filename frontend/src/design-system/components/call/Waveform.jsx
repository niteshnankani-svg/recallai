import React from 'react';

/** Waveform — animated voice-activity bars (agent speaking / listening). */
export function Waveform({ active = true, color = 'var(--accent-primary)', bars = 24, height = 40 }) {
  const heights = React.useMemo(() => Array.from({ length: bars }, () => 0.25 + Math.random() * 0.75), [bars]);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height }}>
      <style>{`
        @keyframes recallai-wave { 0%,100%{transform:scaleY(.35)} 50%{transform:scaleY(1)} }
      `}</style>
      {heights.map((h, i) => (
        <div key={i} style={{
          width: 3, borderRadius: 2, background: color, height: `${h * 100}%`,
          animation: active ? `recallai-wave ${0.6 + (i % 5) * 0.12}s ease-in-out infinite` : 'none',
          animationDelay: `${i * 0.03}s`,
          opacity: active ? 1 : 0.35,
        }} />
      ))}
    </div>
  );
}

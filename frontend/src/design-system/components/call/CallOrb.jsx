import React from 'react';
import { Icon } from '../core/Icon';

const stateMap = {
  idle: { bg: 'var(--ink-100)', icon: 'phone', color: 'var(--text-secondary)', breathe: false },
  connecting: { bg: 'var(--accent-primary-soft)', icon: 'phone-outgoing', color: 'var(--accent-primary)', breathe: true },
  active: { bg: 'var(--accent-primary)', icon: 'phone-call', color: '#fff', breathe: true },
  ended: { bg: 'var(--status-neutral-soft)', icon: 'phone-off', color: 'var(--status-neutral)', breathe: false },
};

/** CallOrb — the central breathing indicator for call state (idle/connecting/active/ended). */
export function CallOrb({ state = 'idle', size = 140 }) {
  const s = stateMap[state] || stateMap.idle;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: s.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: s.breathe ? 'recallai-breathe var(--duration-breath) var(--ease-gentle) infinite' : 'none',
      boxShadow: state === 'active' ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
      transition: 'background-color var(--duration-slow) var(--ease-standard)',
    }}>
      <style>{`@keyframes recallai-breathe{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.08);opacity:.9}}`}</style>
      <Icon name={s.icon} size={size * 0.34} color={s.color} />
    </div>
  );
}

import React from 'react';
import { Icon, Button } from '../design-system/components';

/** Post-call summary — how the call ended. */
export function CallEnded({ duration, onDone }) {
  return (
    <div style={{
      minHeight: '100%', minWidth: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: 'var(--space-16) var(--space-8)', gap: 'var(--space-6)', background: 'var(--surface-app)', boxSizing: 'border-box',
    }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--sage-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="check" size={28} color="var(--sage-700)" />
      </div>
      <div>
        <h2 style={{ font: 'var(--text-display-3)', fontFamily: 'var(--font-display)', color: 'var(--text-primary)', margin: 0 }}>Call ended</h2>
        <p style={{ font: 'var(--text-body-md)', color: 'var(--text-secondary)', margin: 'var(--space-2) 0 0' }}>{duration} · thank you for checking in.</p>
      </div>
      <Button variant="secondary" onClick={onDone}>Back home</Button>
    </div>
  );
}

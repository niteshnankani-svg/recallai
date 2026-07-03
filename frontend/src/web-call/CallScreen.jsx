import React from 'react';
import { CallOrb, Waveform, Badge, TranscriptBubble } from '../design-system/components';

/** In-call screen — orb, live waveform, and the real transcript streaming in
 * over WebSocket. The actual audio happens over the phone call (Twilio), not
 * the browser — so there are no mute/keypad/speaker controls here, just an
 * honest status line for what's really happening. */
export function CallScreen({ state, elapsed, transcript }) {
  const label = { connecting: 'Ringing your phone…', active: 'Connected' }[state] || '';
  const helper = {
    connecting: 'Pick up when your phone rings to begin.',
    active: 'Hang up your phone any time to end the call.',
  }[state] || '';

  return (
    <div style={{ minHeight: '100%', minWidth: '100%', display: 'flex', flexDirection: 'column', background: 'var(--surface-app)', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-10) var(--space-8) var(--space-6)' }}>
        <CallOrb state={state} size={128} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ font: 'var(--text-title-lg)', color: 'var(--text-primary)' }}>RecallAI</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 4 }}>
            <Badge tone={state === 'active' ? 'positive' : 'neutral'} dot>{label}</Badge>
            {state === 'active' && <span style={{ font: 'var(--text-body-sm)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{elapsed}</span>}
          </div>
        </div>
        <Waveform active={state === 'active'} />
        <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-tertiary)', margin: 0 }}>{helper}</p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 var(--space-6) var(--space-4)', maxWidth: 420, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {transcript.map((t, i) => <TranscriptBubble key={i} {...t} />)}
      </div>
    </div>
  );
}

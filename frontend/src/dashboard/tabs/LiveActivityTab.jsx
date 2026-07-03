import React from 'react';
import { Card, Badge } from '../../design-system/components';
import { adminEventsWsUrl } from '../../lib/adminApi';

const LABELS = {
  call_started: (e) => `Call started — ${e.user_name || e.phone || 'unknown'} (${e.direction || 'unknown'})`,
  call_ended: () => 'Call ended',
  transcript: (e) => `Caller: "${e.text}"`,
  ai_response: (e) => `Agent: "${e.text}"`,
  emotion: (e) => `Detected emotion: ${e.emotion}`,
  stage: (e) => `Stage advanced: ${e.stage}`,
  name_captured: (e) => `Name captured: ${e.name}`,
  language_locked: (e) => `Voice locked to ${e.lang}`,
  barge_in: () => 'User interrupted the agent',
};

const MAX_EVENTS = 50;

/** LiveActivityTab — real-time feed across every active call, via the admin
 * WebSocket (services/call_events.py subscribe_admin). */
export function LiveActivityTab() {
  const [events, setEvents] = React.useState([]);
  const [connected, setConnected] = React.useState(false);

  React.useEffect(() => {
    const ws = new WebSocket(adminEventsWsUrl());
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (msg) => {
      const event = JSON.parse(msg.data);
      setEvents((evts) => [event, ...evts].slice(0, MAX_EVENTS));
    };
    return () => ws.close();
  }, []);

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-4)' }}>
        <div style={{ font: 'var(--text-title-md)' }}>Live activity</div>
        <Badge tone={connected ? 'positive' : 'neutral'} dot>{connected ? 'Live' : 'Connecting…'}</Badge>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 480, overflowY: 'auto' }}>
        {events.length === 0 && (
          <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-tertiary)' }}>Nothing here yet — events from active calls will appear as they happen.</p>
        )}
        {events.map((e, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'baseline', font: 'var(--text-body-sm)', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', flexShrink: 0 }}>
              {new Date(e.ts * 1000).toLocaleTimeString()}
            </span>
            <span style={{ color: 'var(--text-primary)' }}>
              {(LABELS[e.type] || ((ev) => ev.type))(e)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

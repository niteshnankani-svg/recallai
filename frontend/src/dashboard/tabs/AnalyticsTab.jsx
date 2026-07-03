import React from 'react';
import { Card } from '../../design-system/components';
import { adminGetJSON, AuthError } from '../../lib/adminApi';
import { Th, Td } from './Table';

function topEmotion(emotions) {
  if (!emotions || emotions.length === 0) return '—';
  const counts = {};
  for (const e of emotions) counts[e] = (counts[e] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

export function AnalyticsTab({ onAuthError }) {
  const [data, setData] = React.useState(null);

  const load = React.useCallback(() => {
    adminGetJSON('/api/admin/analytics').then(setData).catch((e) => {
      if (e instanceof AuthError) onAuthError();
    });
  }, [onAuthError]);

  React.useEffect(() => { load(); }, [load]);

  if (!data) return <div style={{ font: 'var(--text-body-md)', color: 'var(--text-tertiary)' }}>Loading…</div>;

  const perUser = Object.entries(data.calls_per_user || {}).sort((a, b) => b[1] - a[1]);
  const emotions = Object.entries(data.emotion_distribution || {}).sort((a, b) => b[1] - a[1]);
  const recent = data.recent_calls || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ font: 'var(--text-title-lg)', color: 'var(--text-primary)' }}>Total calls</div>
        <div style={{ font: 'var(--text-display-2)', fontFamily: 'var(--font-display)', color: 'var(--accent-primary)' }}>{data.total_calls}</div>
      </Card>
      <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
        <Card style={{ flex: 1 }}>
          <div style={{ font: 'var(--text-title-md)', marginBottom: 10 }}>Calls per user</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><Th>User</Th><Th>Calls</Th></tr></thead>
            <tbody>
              {perUser.length === 0 && <tr><Td>—</Td><Td>No calls yet.</Td></tr>}
              {perUser.map(([u, c]) => <tr key={u}><Td>{u}</Td><Td>{c}</Td></tr>)}
            </tbody>
          </table>
        </Card>
        <Card style={{ flex: 1 }}>
          <div style={{ font: 'var(--text-title-md)', marginBottom: 10 }}>Emotion distribution</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><Th>Emotion</Th><Th>Count</Th></tr></thead>
            <tbody>
              {emotions.length === 0 && <tr><Td>—</Td><Td>No data yet.</Td></tr>}
              {emotions.map(([e, c]) => <tr key={e}><Td style={{ textTransform: 'capitalize' }}>{e}</Td><Td>{c}</Td></tr>)}
            </tbody>
          </table>
        </Card>
      </div>
      <Card>
        <div style={{ font: 'var(--text-title-md)', marginBottom: 10 }}>Recent calls</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><Th>Time</Th><Th>User</Th><Th>Direction</Th><Th>Duration</Th><Th>Exchanges</Th><Th>Top emotion</Th></tr></thead>
          <tbody>
            {recent.length === 0 && <tr><Td>—</Td><Td>—</Td><Td>—</Td><Td>—</Td><Td>—</Td><Td>No calls yet.</Td></tr>}
            {recent.map((c) => (
              <tr key={c.call_sid}>
                <Td>{(c.started_at || '').slice(0, 16).replace('T', ' ')}</Td>
                <Td>{c.user_name}</Td>
                <Td>{c.direction}</Td>
                <Td>{c.duration_seconds != null ? `${c.duration_seconds}s` : 'active'}</Td>
                <Td>{c.exchanges}</Td>
                <Td style={{ textTransform: 'capitalize' }}>{topEmotion(c.emotions)}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

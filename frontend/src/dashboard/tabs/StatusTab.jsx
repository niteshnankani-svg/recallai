import React from 'react';
import { Card, Badge } from '../../design-system/components';
import { adminGetJSON, AuthError } from '../../lib/adminApi';

export function StatusTab({ onAuthError }) {
  const [status, setStatus] = React.useState(null);

  React.useEffect(() => {
    adminGetJSON('/api/admin/status').then(setStatus).catch((e) => {
      if (e instanceof AuthError) onAuthError();
    });
  }, [onAuthError]);

  const entries = status ? Object.entries(status) : [];

  return (
    <Card style={{ maxWidth: 380 }}>
      <div style={{ font: 'var(--text-title-md)', marginBottom: 'var(--space-4)' }}>Environment keys</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map(([k, ok]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ font: 'var(--text-body-sm)', color: 'var(--text-primary)' }}>{k}</span>
            <Badge tone={ok ? 'positive' : 'critical'} dot>{ok ? 'OK' : 'missing'}</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

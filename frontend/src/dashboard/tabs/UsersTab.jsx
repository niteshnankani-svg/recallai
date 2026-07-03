import React from 'react';
import { Card, Input, Button } from '../../design-system/components';
import { adminGetJSON, adminPostJSON, AuthError } from '../../lib/adminApi';
import { Th, Td } from './Table';

export function UsersTab({ onAuthError }) {
  const [users, setUsers] = React.useState({});
  const [phone, setPhone] = React.useState('');
  const [name, setName] = React.useState('');
  const [result, setResult] = React.useState(null);

  const load = React.useCallback(() => {
    adminGetJSON('/api/admin/users').then(setUsers).catch((e) => {
      if (e instanceof AuthError) onAuthError();
    });
  }, [onAuthError]);

  React.useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      const r = await adminPostJSON('/api/admin/users', { phone, name });
      setResult(r);
      if (r.ok) {
        setPhone('');
        setName('');
        load();
      }
    } catch (e) {
      if (e instanceof AuthError) onAuthError();
    }
  };

  const rows = Object.entries(users);

  return (
    <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
      <Card style={{ flex: 1, maxWidth: 380 }}>
        <div style={{ font: 'var(--text-title-md)', marginBottom: 'var(--space-4)' }}>Map a phone number</div>
        <Input label="Phone number" placeholder="+1234567890" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ marginBottom: 'var(--space-3)' }} />
        <Input label="Display name" placeholder="e.g. Nitesh" value={name} onChange={(e) => setName(e.target.value)} style={{ marginBottom: 'var(--space-4)' }} />
        <Button variant="primary" onClick={save} disabled={!phone.trim() || !name.trim()}>Save user</Button>
        {result && !result.ok && <p style={{ font: 'var(--text-body-sm)', color: 'var(--status-critical)' }}>{result.error}</p>}
      </Card>
      <Card style={{ flex: 1 }}>
        <div style={{ font: 'var(--text-title-md)', marginBottom: 10 }}>Registered users</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><Th>Phone</Th><Th>Name</Th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><Td>—</Td><Td>No users registered yet.</Td></tr>}
            {rows.map(([p, n]) => <tr key={p}><Td style={{ fontFamily: 'var(--font-mono)' }}>{p}</Td><Td>{n}</Td></tr>)}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

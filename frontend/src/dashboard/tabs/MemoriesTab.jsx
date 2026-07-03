import React from 'react';
import { Card } from '../../design-system/components';
import { adminGetJSON, AuthError } from '../../lib/adminApi';
import { Th, Td } from './Table';

export function MemoriesTab({ onAuthError }) {
  const [rows, setRows] = React.useState([]);

  React.useEffect(() => {
    adminGetJSON('/api/admin/memories').then(setRows).catch((e) => {
      if (e instanceof AuthError) onAuthError();
    });
  }, [onAuthError]);

  return (
    <Card>
      <div style={{ font: 'var(--text-title-md)', marginBottom: 10 }}>Stored memories</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead><tr><Th>Date</Th><Th>User</Th><Th>Memory fact</Th></tr></thead>
        <tbody>
          {rows.length === 0 && <tr><Td>—</Td><Td>—</Td><Td>No memories stored yet.</Td></tr>}
          {rows.map((r, i) => <tr key={i}><Td>{r.date}</Td><Td>{r.user}</Td><Td>{r.fact}</Td></tr>)}
        </tbody>
      </table>
    </Card>
  );
}

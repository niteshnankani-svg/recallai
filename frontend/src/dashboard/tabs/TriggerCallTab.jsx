import React from 'react';
import { Card, Input, Button, Badge } from '../../design-system/components';
import { adminPostJSON, AuthError } from '../../lib/adminApi';

export function TriggerCallTab({ onAuthError }) {
  const [phone, setPhone] = React.useState('+919850509898');
  const [result, setResult] = React.useState(null);
  const [calling, setCalling] = React.useState(false);

  const call = async () => {
    setCalling(true);
    setResult(null);
    try {
      const r = await adminPostJSON('/api/admin/call', { phone_number: phone });
      setResult(r);
    } catch (e) {
      if (e instanceof AuthError) onAuthError();
      else setResult({ ok: false, error: 'Request failed.' });
    } finally {
      setCalling(false);
    }
  };

  return (
    <Card style={{ maxWidth: 460 }}>
      <div style={{ font: 'var(--text-title-md)', marginBottom: 'var(--space-4)' }}>Trigger a call</div>
      <Input label="Phone number" icon="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <Button variant="primary" icon="phone-outgoing" style={{ marginTop: 'var(--space-4)' }} onClick={call} disabled={calling}>
        {calling ? 'Calling…' : 'Call now'}
      </Button>
      <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-tertiary)', marginTop: 'var(--space-3)' }}>
        Twilio trial accounts can only call verified numbers.
      </p>
      {result && result.ok && (
        <Badge tone="positive" dot style={{ marginTop: 'var(--space-3)' }}>Call initiated! SID: {result.call_sid || result.sid}</Badge>
      )}
      {result && !result.ok && (
        <Badge tone="critical" dot style={{ marginTop: 'var(--space-3)' }}>{result.error}</Badge>
      )}
    </Card>
  );
}

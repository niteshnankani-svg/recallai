import React from 'react';
import { Card, Input, Button } from '../design-system/components';
import { setStoredAuth } from '../lib/adminAuth';

/** Login — collects Basic Auth credentials into a custom form (rather than
 * relying on the browser's native auth prompt, which doesn't reliably share
 * credentials with the WebSocket handshake). */
export function Login({ onAuthenticated, error }) {
  const [username, setUsername] = React.useState('admin');
  const [password, setPassword] = React.useState('');

  const submit = (e) => {
    e.preventDefault();
    setStoredAuth(username, password);
    onAuthenticated();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-app)', boxSizing: 'border-box' }}>
      <form onSubmit={submit}>
        <Card style={{ width: 340, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ font: 'var(--text-display-3)', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>RecallAI</div>
            <div style={{ font: 'var(--text-body-sm)', color: 'var(--text-tertiary)' }}>Admin dashboard sign-in</div>
          </div>
          <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p style={{ font: 'var(--text-body-sm)', color: 'var(--status-critical)', margin: 0 }}>{error}</p>}
          <Button variant="primary" onClick={submit} disabled={!password}>Sign in</Button>
        </Card>
      </form>
    </div>
  );
}

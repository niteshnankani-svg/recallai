import React from 'react';
import { Icon, Button, Input } from '../design-system/components';

/** Landing screen — enter a phone number, request a call. */
export function CallLanding({ onCall, submitting, error }) {
  const [phone, setPhone] = React.useState('');

  const submit = (e) => {
    e.preventDefault();
    if (phone.trim()) onCall(phone.trim());
  };

  return (
    <form
      onSubmit={submit}
      style={{
        minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: 'var(--space-16) var(--space-8)', gap: 'var(--space-6)',
        background: 'radial-gradient(circle at 50% 30%, var(--clay-50), var(--surface-app) 65%)',
        boxSizing: 'border-box', minWidth: '100%',
      }}
    >
      <div style={{
        width: 84, height: 84, borderRadius: '50%', background: 'var(--accent-primary-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="heart-handshake" size={38} color="var(--accent-primary)" />
      </div>
      <div>
        <div style={{ font: 'var(--text-label)', letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)' }}>
          RecallAI
        </div>
        <h1 style={{ font: 'var(--text-display-1)', color: 'var(--text-primary)', margin: 0, maxWidth: 340 }}>
          How are you feeling today?
        </h1>
        <p style={{ font: 'var(--text-body-lg)', color: 'var(--text-secondary)', maxWidth: 340, margin: 'var(--space-4) auto 0' }}>
          A warm check-in call, whenever you need it. English or Hindi — whatever feels natural.
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: 320 }}>
        <Input
          label="Your phone number"
          icon="phone"
          type="tel"
          placeholder="+919850509898"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={submitting}
        />
      </div>

      {error && (
        <p style={{ font: 'var(--text-body-sm)', color: 'var(--status-critical)', maxWidth: 320, margin: 0 }}>
          {error}
        </p>
      )}

      <Button
        variant="primary" size="lg" icon="phone-call" disabled={submitting || !phone.trim()}
        style={{ padding: '18px 40px', fontSize: 17 }}
        onClick={submit}
      >
        {submitting ? 'Calling…' : 'Call RecallAI'}
      </Button>
      <p style={{ font: 'var(--text-body-sm)', color: 'var(--text-tertiary)', maxWidth: 320 }}>
        In crisis? Reach iCall directly at <strong>9152987821</strong> — available any time.
      </p>
    </form>
  );
}

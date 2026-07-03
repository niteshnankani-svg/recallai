import React from 'react';
import { Tabs } from '../design-system/components';
import { Login } from './Login';
import { AnalyticsTab } from './tabs/AnalyticsTab';
import { LiveActivityTab } from './tabs/LiveActivityTab';
import { TriggerCallTab } from './tabs/TriggerCallTab';
import { UsersTab } from './tabs/UsersTab';
import { MemoriesTab } from './tabs/MemoriesTab';
import { StatusTab } from './tabs/StatusTab';
import { getStoredAuth, clearStoredAuth } from '../lib/adminAuth';
import { adminGetJSON, AuthError } from '../lib/adminApi';

const TABS = [
  { value: 'analytics', label: 'Analytics' },
  { value: 'live', label: 'Live Activity' },
  { value: 'call', label: 'Trigger a Call' },
  { value: 'users', label: 'Users' },
  { value: 'memories', label: 'Stored Memories' },
  { value: 'status', label: 'System Status' },
];

export function App() {
  // 'checking' | 'authed' | 'unauthed'
  const [authState, setAuthState] = React.useState(getStoredAuth() ? 'checking' : 'unauthed');
  const [loginError, setLoginError] = React.useState(null);
  const [tab, setTab] = React.useState('analytics');

  React.useEffect(() => {
    if (authState !== 'checking') return;
    adminGetJSON('/api/admin/status')
      .then(() => setAuthState('authed'))
      .catch(() => setAuthState('unauthed'));
  }, [authState]);

  const onAuthError = React.useCallback(() => {
    clearStoredAuth();
    setLoginError('Session expired — please sign in again.');
    setAuthState('unauthed');
  }, []);

  const onAuthenticated = () => {
    setLoginError(null);
    setAuthState('checking');
  };

  if (authState !== 'authed') {
    return <Login onAuthenticated={onAuthenticated} error={loginError} />;
  }

  return (
    <div style={{ minHeight: '100%', background: 'var(--surface-app)', fontFamily: 'var(--font-body)' }}>
      <div style={{ padding: 'var(--space-6) var(--space-8) 0' }}>
        <div style={{ font: 'var(--text-display-3)', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>RecallAI — Admin Panel</div>
        <div style={{ font: 'var(--text-body-sm)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-4)' }}>Voice AI wellness companion — internal ops</div>
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>
      <div style={{ padding: 'var(--space-6) var(--space-8) var(--space-10)' }}>
        {tab === 'analytics' && <AnalyticsTab onAuthError={onAuthError} />}
        {tab === 'live' && <LiveActivityTab />}
        {tab === 'call' && <TriggerCallTab onAuthError={onAuthError} />}
        {tab === 'users' && <UsersTab onAuthError={onAuthError} />}
        {tab === 'memories' && <MemoriesTab onAuthError={onAuthError} />}
        {tab === 'status' && <StatusTab onAuthError={onAuthError} />}
      </div>
    </div>
  );
}

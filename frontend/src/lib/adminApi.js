import { authHeaders, authQueryParam, clearStoredAuth } from './adminAuth';
import { wsUrl } from './api';

export class AuthError extends Error {}

async function request(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  if (res.status === 401) {
    clearStoredAuth();
    throw new AuthError('Authentication required.');
  }
  return res.json();
}

export function adminGetJSON(path) {
  return request(path);
}

export function adminPostJSON(path, body) {
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function adminEventsWsUrl() {
  return wsUrl(`/api/admin/events${authQueryParam()}`);
}

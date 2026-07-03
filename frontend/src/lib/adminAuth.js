const STORAGE_KEY = 'recallai_admin_auth'; // sessionStorage: base64("user:pass")

export function getStoredAuth() {
  return sessionStorage.getItem(STORAGE_KEY);
}

export function setStoredAuth(username, password) {
  const token = btoa(`${username}:${password}`);
  sessionStorage.setItem(STORAGE_KEY, token);
  return token;
}

export function clearStoredAuth() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function authHeaders() {
  const token = getStoredAuth();
  return token ? { Authorization: `Basic ${token}` } : {};
}

// The admin WS can't receive a custom Authorization header (browsers don't
// expose one for the WebSocket handshake), so credentials travel as a query
// param instead — see routers/web_api.py's admin_events_ws.
export function authQueryParam() {
  const token = getStoredAuth();
  return token ? `?auth=${encodeURIComponent(token)}` : '';
}

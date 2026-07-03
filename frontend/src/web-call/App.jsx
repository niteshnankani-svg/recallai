import React from 'react';
import { CallLanding } from './CallLanding';
import { CallScreen } from './CallScreen';
import { CallEnded } from './CallEnded';
import { postJSON, wsUrl } from '../lib/api';

function formatElapsed(sec) {
  const mm = String(Math.floor(sec / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

/** App — wires landing → connecting → active → ended to the real backend
 * (POST /api/call to trigger, WebSocket /api/call/{sid}/events to watch). */
export function App() {
  const [state, setState] = React.useState('idle'); // idle | connecting | active | ended
  const [transcript, setTranscript] = React.useState([]);
  const [elapsedSec, setElapsedSec] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState(null);
  const wsRef = React.useRef(null);

  const closeSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  React.useEffect(() => () => closeSocket(), []);

  React.useEffect(() => {
    if (state !== 'active') return;
    const id = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [state]);

  const watchCall = (callSid) => {
    const ws = new WebSocket(wsUrl(`/api/call/${callSid}/events`));
    wsRef.current = ws;
    ws.onmessage = (msg) => {
      const event = JSON.parse(msg.data);
      switch (event.type) {
        case 'call_started':
          setState('active');
          setElapsedSec(0);
          break;
        case 'transcript':
          setTranscript((t) => [...t, { from: 'caller', text: event.text }]);
          break;
        case 'ai_response':
          setTranscript((t) => [...t, { from: 'agent', text: event.text }]);
          break;
        case 'emotion':
          setTranscript((t) => {
            const next = [...t];
            for (let i = next.length - 1; i >= 0; i--) {
              if (next[i].from === 'caller' && !next[i].emotion) {
                next[i] = { ...next[i], emotion: event.emotion };
                break;
              }
            }
            return next;
          });
          break;
        case 'call_ended':
          setState('ended');
          closeSocket();
          break;
        default:
          break;
      }
    };
    ws.onerror = () => {};
  };

  const startCall = async (phone) => {
    setError(null);
    setSubmitting(true);
    try {
      const result = await postJSON('/api/call', { phone_number: phone });
      if (!result.ok) {
        setError(result.error || 'Something went wrong — please try again.');
        return;
      }
      setTranscript([]);
      setState('connecting');
      watchCall(result.call_sid);
    } catch {
      setError('Could not reach RecallAI — please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    closeSocket();
    setState('idle');
    setError(null);
  };

  return (
    <div style={{ width: '100%', height: '100%', fontFamily: 'var(--font-body)' }}>
      {state === 'idle' && <CallLanding onCall={startCall} submitting={submitting} error={error} />}
      {(state === 'connecting' || state === 'active') && (
        <CallScreen state={state} elapsed={formatElapsed(elapsedSec)} transcript={transcript} />
      )}
      {state === 'ended' && <CallEnded duration={formatElapsed(elapsedSec)} onDone={reset} />}
    </div>
  );
}

import { useState } from 'react';
import { api } from '../api.js';
import Button from '../design-system/Button.jsx';

export default function ConsentPlayback({ parentId }) {
  const [state, setState] = useState({ error: '', loading: false, playback: null });

  async function requestPlayback() {
    setState({ error: '', loading: true, playback: null });
    try {
      const playback = await api(`/parents/${parentId}/consent/playback`, { method: 'POST' });
      setState({ error: '', loading: false, playback });
    } catch (error) {
      setState({ error: error.message, loading: false, playback: null });
    }
  }

  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <p className="text-sm font-medium uppercase tracking-wide text-primary">Consent recording</p>
      <h2 className="mt-1 text-lg font-semibold text-text">Parent’s recorded agreement</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Playback is access-controlled and recorded in the care audit trail.
      </p>
      {!state.playback ? (
        <Button className="mt-4" loading={state.loading} onClick={requestPlayback} type="button">
          Play consent recording
        </Button>
      ) : (
        <div className="mt-4 space-y-2">
          <video
            className="w-full rounded-md border border-border bg-text"
            controls
            src={state.playback.url}
          >
            Your browser cannot play this consent recording.
          </video>
          <p className="text-xs text-muted">
            This secure playback link expires at{' '}
            {new Date(state.playback.expiresAt).toLocaleTimeString()}.
          </p>
        </div>
      )}
      {state.error ? <p className="mt-3 text-sm text-emergency">{state.error}</p> : null}
    </section>
  );
}

import { useEffect, useState } from 'react';
import { api } from '../api.js';

function timestamp(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function NotificationInbox() {
  const [state, setState] = useState({ error: '', items: [], loading: true, unreadCount: 0 });

  useEffect(() => {
    let active = true;
    api('/notifications')
      .then((data) => {
        if (active)
          setState({ error: '', items: data.items, loading: false, unreadCount: data.unreadCount });
      })
      .catch((error) => {
        if (active) setState({ error: error.message, items: [], loading: false, unreadCount: 0 });
      });
    return () => {
      active = false;
    };
  }, []);

  async function markRead(id) {
    try {
      const updated = await api(`/notifications/${id}/read`, { method: 'POST' });
      setState((current) => ({
        ...current,
        items: current.items.map((item) => (item.id === id ? updated : item)),
        unreadCount: Math.max(0, current.unreadCount - (updated.readAt ? 1 : 0)),
      }));
      window.dispatchEvent(new CustomEvent('rozvisit:notification-read'));
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }));
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-lg border border-border bg-primary-soft p-5 shadow-sm sm:p-6">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            RozVisit notifications
          </p>
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-text sm:text-3xl">
              Notifications
            </h1>
            <p className="text-sm text-muted">{state.unreadCount} unread</p>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted">
            Keep track of care updates, account activity, and important next steps.
          </p>
        </header>
        <section className="mt-6 rounded-lg border border-border bg-surface shadow-sm">
          {state.loading ? <p className="p-6 text-sm text-muted">Loading notifications…</p> : null}
          {state.error ? <p className="p-6 text-sm text-emergency">{state.error}</p> : null}
          {!state.loading && !state.error && state.items.length === 0 ? (
            <p className="p-6 text-sm text-muted">You are all caught up.</p>
          ) : null}
          {state.items.map((item) => (
            <article
              className={`border-b border-border p-4 sm:p-5 last:border-0 ${item.readAt ? '' : 'bg-primary-soft'}`}
              key={item.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-text">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">{item.body}</p>
                  <p className="mt-2 text-xs text-muted">{timestamp(item.createdAt)}</p>
                </div>
                {!item.readAt ? (
                  <button
                    className="text-sm font-medium text-primary underline"
                    onClick={() => void markRead(item.id)}
                    type="button"
                  >
                    Mark read
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

import { useEffect, useState } from 'react';
import { ApiError, api } from '../../api.js';
import BrandMark from '../../design-system/BrandMark.jsx';
import StatusBadge from '../../design-system/StatusBadge.jsx';
import { navigateFromLink } from '../../navigation.js';

export default function Today() {
  const [state, setState] = useState({ error: '', items: [], loading: true });

  useEffect(() => {
    let active = true;
    api('/visits/today')
      .then(({ items }) => {
        if (active) setState({ error: '', items, loading: false });
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 403) {
          window.location.assign('/care/status');
          return;
        }
        if (active) setState({ error: error.message, items: [], loading: false });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <header className="border-b border-border pb-6">
          <BrandMark />
          <p className="mt-5 text-sm font-medium text-primary">Caregiver portal</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-text">
            Today&apos;s visits
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Your assigned visits are saved for offline viewing.
          </p>
        </header>
        <section className="mt-6 rounded-lg border border-border bg-surface p-6 shadow-sm">
          {state.loading ? (
            <p className="text-sm text-muted">Loading today&apos;s visits…</p>
          ) : null}
          {state.error ? <p className="text-sm text-emergency">{state.error}</p> : null}
          {!state.loading && !state.error && state.items.length === 0 ? (
            <>
              <p className="text-lg font-semibold text-text">No visits today</p>
              <p className="mt-2 text-sm leading-6 text-muted">No visits today. Enjoy the break.</p>
            </>
          ) : null}
          {state.items.map((visit) => (
            <a
              className="block border-b border-border py-4 last:border-0"
              href={`/care/visits/${visit.id}`}
              key={visit.id}
              onClick={(event) => navigateFromLink(event, `/care/visits/${visit.id}`)}
            >
              <p className="font-semibold text-text">Scheduled visit</p>
              <p className="mt-1 text-sm text-muted">
                {new Date(visit.scheduledAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </a>
          ))}
          <div className="mt-5 border-t border-border pt-5">
            <StatusBadge variant="neutral">Saved for offline viewing</StatusBadge>
          </div>
        </section>
      </div>
    </main>
  );
}

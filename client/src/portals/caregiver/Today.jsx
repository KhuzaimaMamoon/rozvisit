import { useEffect, useState } from 'react';
import { ApiError, api } from '../../api.js';
import StatusBadge from '../../design-system/StatusBadge.jsx';
import { navigateFromLink } from '../../navigation.js';
import { queuedCompletions } from '../../offline/visitQueue.js';
import SyncStateBar from './SyncStateBar.jsx';

const statusVariants = Object.freeze({
  completed: 'success',
  flagged: 'emergency',
  in_progress: 'pending',
  missed: 'emergency',
  parent_declined: 'pending',
  scheduled: 'neutral',
});

function statusLabel(status) {
  return status.replaceAll('_', ' ');
}

function mapsUrl(location) {
  if (!Number.isFinite(location?.lat) || !Number.isFinite(location?.lng)) return null;
  return `https://www.google.com/maps?q=${encodeURIComponent(`${location.lat},${location.lng}`)}`;
}

function todayLabel() {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  }).format(new Date());
}

export default function Today() {
  const [state, setState] = useState({
    error: '',
    items: [],
    loading: true,
    pendingVisitIds: [],
  });

  useEffect(() => {
    let active = true;

    async function loadToday() {
      try {
        const [{ items }, queued] = await Promise.all([
          api('/visits/today'),
          queuedCompletions().catch(() => []),
        ]);
        if (active) {
          setState({
            error: '',
            items,
            loading: false,
            pendingVisitIds: queued.map((item) => item.visitId),
          });
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 403) {
          window.location.assign('/care/status');
          return;
        }
        if (active) {
          setState({ error: error.message, items: [], loading: false, pendingVisitIds: [] });
        }
      }
    }

    void loadToday();
    window.addEventListener('online', loadToday);
    return () => {
      active = false;
      window.removeEventListener('online', loadToday);
    };
  }, []);

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-lg border border-border bg-primary-soft p-5 shadow-sm sm:p-6">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            Caregiver portal
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            {todayLabel()}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">Today&apos;s assigned visits.</p>
        </header>
        <section className="mt-6 overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          {state.loading ? (
            <p className="p-5 text-sm text-muted sm:p-6">Loading today&apos;s visits…</p>
          ) : null}
          {state.error ? <p className="p-5 text-sm text-emergency sm:p-6">{state.error}</p> : null}
          {!state.loading && !state.error && state.items.length === 0 ? (
            <>
              <div className="p-5 sm:p-6">
                <p className="text-lg font-semibold text-text">No visits today</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  No visits today. Enjoy the break.
                </p>
              </div>
            </>
          ) : null}
          {state.items.map((visit) => (
            <article
              className="border-b border-border px-5 py-4 transition-colors hover:bg-primary-soft last:border-0 sm:px-6"
              key={visit.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <a
                  className="min-w-0 flex-1"
                  href={`/care/visits/${visit.id}`}
                  onClick={(event) => navigateFromLink(event, `/care/visits/${visit.id}`)}
                >
                  <p className="text-lg font-semibold text-text">
                    {new Date(visit.scheduledAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="mt-1 font-medium text-text">{visit.parentName}</p>
                  <p className="mt-1 text-sm text-muted">{visit.addressText}</p>
                </a>
                <StatusBadge variant={statusVariants[visit.status] ?? 'neutral'}>
                  {statusLabel(visit.status)}
                </StatusBadge>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                {mapsUrl(visit.location) ? (
                  <a
                    className="text-sm font-medium text-primary underline"
                    href={mapsUrl(visit.location)}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open location in maps
                  </a>
                ) : (
                  <span className="text-sm text-muted">Location unavailable</span>
                )}
                <SyncStateBar
                  state={state.pendingVisitIds.includes(visit.id) ? 'pending' : 'synced'}
                />
              </div>
            </article>
          ))}
        </section>
        <a
          className="sticky bottom-3 mt-6 block rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium text-primary shadow-sm"
          href="/care/earnings"
        >
          Earnings
        </a>
      </div>
    </main>
  );
}

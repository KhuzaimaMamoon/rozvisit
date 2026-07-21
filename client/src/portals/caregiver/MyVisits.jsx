import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import Button from '../../design-system/Button.jsx';
import StatusBadge from '../../design-system/StatusBadge.jsx';

function statusVariant(status) {
  if (status === 'completed') return 'success';
  if (status === 'missed' || status === 'parent_declined') return 'pending';
  return 'neutral';
}

export default function MyVisits() {
  const [state, setState] = useState({ error: '', items: [], loading: true, nextCursor: null });
  const [loadingMore, setLoadingMore] = useState(false);

  async function load(cursor = null) {
    const query = new URLSearchParams({ limit: '20' });
    if (cursor) query.set('before', cursor);
    const data = await api(`/visits/mine?${query.toString()}`);
    setState((current) => ({
      error: '',
      items: cursor ? [...current.items, ...data.items] : data.items,
      loading: false,
      nextCursor: data.nextCursor,
    }));
  }

  useEffect(() => {
    load().catch((error) =>
      setState({ error: error.message, items: [], loading: false, nextCursor: null }),
    );
  }, []);

  async function loadMore() {
    if (!state.nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      await load(state.nextCursor);
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }));
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-lg border border-border bg-primary-soft p-5 shadow-sm sm:p-6">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            Caregiver visits
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            My visits
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Your assigned visits, newest first, including scheduled and completed care.
          </p>
        </header>

        <section className="mt-6 space-y-3">
          {state.loading ? (
            <p className="rounded-lg border border-border bg-surface p-5 text-sm text-muted">
              Loading your visits…
            </p>
          ) : null}
          {state.error ? (
            <p className="rounded-lg border border-emergency bg-emergency-soft p-5 text-sm text-emergency">
              {state.error}
            </p>
          ) : null}
          {!state.loading && !state.error && !state.items.length ? (
            <p className="rounded-lg border border-border bg-surface p-5 text-sm text-muted">
              You do not have any assigned visits yet.
            </p>
          ) : null}
          {state.items.map((visit) => (
            <article
              className="rounded-lg border border-border bg-surface p-4 shadow-sm sm:p-5"
              key={visit.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Parent</p>
                  <h2 className="mt-1 text-lg font-semibold text-text">{visit.parentName}</h2>
                  <p className="mt-1 text-sm leading-6 text-muted">{visit.addressText}</p>
                </div>
                <StatusBadge variant={statusVariant(visit.status)}>
                  {visit.status.replace('_', ' ')}
                </StatusBadge>
              </div>
              <p className="mt-4 text-sm font-medium text-text">
                {new Date(visit.scheduledAt).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </article>
          ))}
          {state.nextCursor ? (
            <Button loading={loadingMore} onClick={() => void loadMore()} variant="secondary">
              Load older visits
            </Button>
          ) : null}
        </section>
      </div>
    </main>
  );
}

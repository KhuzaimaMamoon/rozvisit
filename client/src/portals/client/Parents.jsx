import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import Button from '../../design-system/Button.jsx';
import StatusBadge from '../../design-system/StatusBadge.jsx';
import { navigateFromLink } from '../../navigation.js';
export default function Parents() {
  const [state, setState] = useState({ items: [], loading: true, error: '' });
  useEffect(() => {
    api('/parents')
      .then(({ items }) => setState({ items, loading: false, error: '' }))
      .catch((error) => setState({ items: [], loading: false, error: error.message }));
  }, []);
  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-end justify-between gap-4 rounded-lg border border-border bg-primary-soft p-5 shadow-sm sm:p-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-primary">Your family</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
              My parents
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              Keep each parent&apos;s care details and visit updates in one place.
            </p>
          </div>
          <a
            className="w-full sm:w-auto"
            href="/app/parents/new"
            onClick={(event) => navigateFromLink(event, '/app/parents/new')}
          >
            <Button className="w-full sm:w-auto">Add your parent</Button>
          </a>
        </header>
        <section className="mt-6 overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          {state.loading ? <p className="p-5 text-sm text-muted">Loading parents…</p> : null}
          {state.error ? <p className="p-5 text-sm text-emergency">{state.error}</p> : null}
          {!state.loading && !state.error && !state.items.length ? (
            <p className="p-5 text-sm text-muted">Add your parent to begin.</p>
          ) : null}
          {state.items.map((parent) => (
            <a
              className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 transition-colors hover:bg-primary-soft last:border-0"
              href={`/app/parents/${parent.id}`}
              key={parent.id}
              onClick={(event) => navigateFromLink(event, `/app/parents/${parent.id}`)}
            >
              <span>
                <span className="block text-sm font-semibold text-text">{parent.name}</span>
                <span className="mt-1 block text-xs text-muted">View care profile and updates</span>
              </span>
              <StatusBadge variant={parent.status === 'active' ? 'success' : 'pending'}>
                {parent.status.replace('_', ' ')}
              </StatusBadge>
            </a>
          ))}
        </section>
      </div>
    </main>
  );
}

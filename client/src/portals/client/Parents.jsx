import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import BrandMark from '../../design-system/BrandMark.jsx';
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
      <div className="mx-auto max-w-4xl">
        <BrandMark />
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Your family</p>
            <h1 className="mt-1 text-3xl font-semibold text-text">My parents</h1>
          </div>
          <a
            href="/app/parents/new"
            onClick={(event) => navigateFromLink(event, '/app/parents/new')}
          >
            <Button>Add your parent</Button>
          </a>
        </div>
        <section className="mt-6 rounded-lg border border-border bg-surface p-5 shadow-sm">
          {state.loading ? <p className="text-sm text-muted">Loading parents…</p> : null}
          {state.error ? <p className="text-sm text-emergency">{state.error}</p> : null}
          {!state.loading && !state.error && !state.items.length ? (
            <p className="text-sm text-muted">Add your parent to begin.</p>
          ) : null}
          {state.items.map((parent) => (
            <a
              className="flex items-center justify-between border-b border-border py-4 last:border-0"
              href={`/app/parents/${parent.id}`}
              key={parent.id}
              onClick={(event) => navigateFromLink(event, `/app/parents/${parent.id}`)}
            >
              <span className="font-medium text-text">{parent.name}</span>
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

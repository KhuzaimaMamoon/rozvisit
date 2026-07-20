import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import StatusBadge from '../../design-system/StatusBadge.jsx';
import { navigateFromLink } from '../../navigation.js';

const filters = [
  ['all', 'All'],
  ['applied', 'Applied'],
  ['in_review', 'In review'],
];

function GateSummary({ gates }) {
  return (
    <span className="text-sm text-muted">
      CNIC: {gates.cnic ? 'complete' : 'pending'} · Interview:{' '}
      {gates.interview ? 'complete' : 'pending'} · Reference:{' '}
      {gates.reference ? 'complete' : 'pending'}
    </span>
  );
}

export default function ApplicationsQueue() {
  const [filter, setFilter] = useState('all');
  const [state, setState] = useState({ error: '', items: [], loading: true });

  useEffect(() => {
    const query = filter === 'all' ? '' : `?status=${filter}`;
    setState((current) => ({ ...current, error: '', loading: true }));
    api(`/admin/applications${query}`)
      .then(({ items }) => setState({ error: '', items, loading: false }))
      .catch((error) => setState({ error: error.message, items: [], loading: false }));
  }, [filter]);

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-lg border border-border bg-primary-soft p-5 shadow-sm sm:p-6">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            Admin operations
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            Caregiver applications
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Review each application and the progress of its verification gates.
          </p>
        </header>
        <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Application status">
          {filters.map(([value, label]) => (
            <button
              className="border border-border bg-surface px-3 py-2 text-sm text-text"
              key={value}
              onClick={() => setFilter(value)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <section className="mt-5 overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          {state.loading ? <p className="p-5 text-sm text-muted">Loading applications…</p> : null}
          {state.error ? <p className="p-5 text-sm text-emergency">{state.error}</p> : null}
          {!state.loading && !state.error && !state.items.length ? (
            <p className="p-5 text-sm text-muted">No pending applications.</p>
          ) : null}
          {state.items.map((application) => (
            <article
              className="border-b border-border px-5 py-4 transition-colors hover:bg-primary-soft last:border-0"
              key={application.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-text">{application.applicant.name}</p>
                  <p className="mt-1 text-sm text-muted">
                    Area: {application.serviceArea.lat}, {application.serviceArea.lng}
                  </p>
                </div>
                <StatusBadge variant={application.status === 'verified' ? 'success' : 'pending'}>
                  {application.status.replace('_', ' ')}
                </StatusBadge>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <GateSummary gates={application.gates} />
                <a
                  className="text-sm font-medium text-primary underline"
                  href={`/admin/applications/${application.id}`}
                  onClick={(event) =>
                    navigateFromLink(event, `/admin/applications/${application.id}`)
                  }
                >
                  Open application
                </a>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

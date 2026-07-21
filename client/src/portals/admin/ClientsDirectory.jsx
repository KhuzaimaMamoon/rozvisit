import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import StatusBadge from '../../design-system/StatusBadge.jsx';

function statusVariant(status) {
  return status === 'active' ? 'success' : status === 'cancelled' ? 'emergency' : 'pending';
}

export default function ClientsDirectory() {
  const [state, setState] = useState({ error: '', items: [], loading: true });

  useEffect(() => {
    api('/admin/clients?limit=100')
      .then(({ items }) => setState({ error: '', items, loading: false }))
      .catch((error) => setState({ error: error.message, items: [], loading: false }));
  }, []);

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-lg border border-border bg-primary-soft p-5 shadow-sm sm:p-6">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            Admin directory
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            Clients
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Review client contact details, their parents, and subscription status at a glance.
          </p>
        </header>
        <section className="mt-6 rounded-lg border border-border bg-surface shadow-sm">
          {state.loading ? <p className="p-5 text-sm text-muted">Loading clients…</p> : null}
          {state.error ? <p className="p-5 text-sm text-emergency">{state.error}</p> : null}
          {!state.loading && !state.error && !state.items.length ? (
            <p className="p-5 text-sm text-muted">No clients are registered yet.</p>
          ) : null}
          {state.items.map((client) => (
            <article className="border-b border-border p-5 last:border-b-0" key={client.id}>
              <h2 className="font-semibold text-text">{client.name}</h2>
              <p className="mt-1 text-sm text-muted">
                {client.email} · {client.phone} · {client.countryCode ?? 'Country unavailable'} ·{' '}
                {client.currency ?? 'Currency unavailable'}
              </p>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <section>
                  <h3 className="text-sm font-medium text-text">Parents</h3>
                  {client.parents.length ? (
                    <ul className="mt-2 space-y-2">
                      {client.parents.map((parent) => (
                        <li
                          className="flex flex-wrap items-center gap-2 text-sm text-muted"
                          key={parent.id}
                        >
                          <span>{parent.name}</span>
                          <StatusBadge variant={statusVariant(parent.status)}>
                            {parent.status}
                          </StatusBadge>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-muted">No parent profiles yet.</p>
                  )}
                </section>
                <section>
                  <h3 className="text-sm font-medium text-text">Subscriptions</h3>
                  {client.subscriptions.length ? (
                    <ul className="mt-2 space-y-2">
                      {client.subscriptions.map((subscription) => (
                        <li
                          className="flex flex-wrap items-center gap-2 text-sm text-muted"
                          key={subscription.id}
                        >
                          <span>{subscription.planKey}</span>
                          <StatusBadge variant={statusVariant(subscription.state)}>
                            {subscription.state.replace('_', ' ')}
                          </StatusBadge>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-muted">No subscriptions yet.</p>
                  )}
                </section>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

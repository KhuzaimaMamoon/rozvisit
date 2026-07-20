import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api.js';
import StatusBadge from '../../design-system/StatusBadge.jsx';
import { navigateFromLink } from '../../navigation.js';
export default function ParentOverview() {
  const id = useMemo(() => window.location.pathname.split('/').at(-1), []);
  const [state, setState] = useState({ item: null, error: '' });
  useEffect(() => {
    api(`/parents/${id}`)
      .then((item) => setState({ item, error: '' }))
      .catch((error) => setState({ item: null, error: error.message }));
  }, [id]);
  if (state.error)
    return (
      <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
        <section className="mx-auto max-w-7xl rounded-lg border border-emergency bg-emergency-soft p-6 shadow-sm">
          <p className="text-sm text-emergency">{state.error}</p>
        </section>
      </main>
    );
  if (!state.item)
    return (
      <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
        <section className="mx-auto max-w-7xl rounded-lg border border-border bg-surface p-6 shadow-sm">
          <p className="text-sm text-muted">Loading parent…</p>
        </section>
      </main>
    );
  const p = state.item;
  const links = [
    ['Visit proof', `/app/parents/${id}/feed`],
    ['Schedule visits', `/app/parents/${id}/schedule`],
    ['Choose a plan', `/app/parents/${id}/plan`],
  ];
  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-lg border border-border bg-primary-soft p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium uppercase tracking-wide text-primary">
                Parent profile
              </p>
              <h1 className="mt-2 break-words text-2xl font-semibold tracking-tight text-text sm:text-3xl">
                {p.name}
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted">
                Care information and visit options.
              </p>
            </div>
            <StatusBadge variant={p.status === 'active' ? 'success' : 'pending'}>
              {p.status.replace('_', ' ')}
            </StatusBadge>
          </div>
        </header>
        <section className="mt-6 rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-md bg-primary-soft p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">Address</dt>
              <dd className="mt-2 text-sm leading-6 text-text">{p.addressText}</dd>
            </div>
            <div className="rounded-md bg-primary-soft p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                Care status
              </dt>
              <dd className="mt-2 text-sm font-medium capitalize text-text">
                {p.status.replace('_', ' ')}
              </dd>
            </div>
          </dl>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {links.map(([label, href]) => (
              <a
                className="rounded-md border border-border bg-surface px-4 py-4 text-center text-sm font-medium text-primary transition-colors hover:bg-primary-soft"
                href={href}
                key={href}
                onClick={(event) => navigateFromLink(event, href)}
              >
                {label}
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

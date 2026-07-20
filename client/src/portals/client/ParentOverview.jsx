import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api.js';
import BrandMark from '../../design-system/BrandMark.jsx';
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
  if (state.error) return <main className="portal-placeholder text-emergency">{state.error}</main>;
  if (!state.item) return <main className="portal-placeholder text-muted">Loading parent…</main>;
  const p = state.item;
  const links = [
    ['Visit proof', `/app/parents/${id}/feed`],
    ['Schedule visits', `/app/parents/${id}/schedule`],
    ['Choose a plan', `/app/parents/${id}/plan`],
  ];
  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <BrandMark />
        <section className="mt-6 rounded-lg border border-border bg-surface p-6 shadow-sm">
          <div className="flex justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-primary">Parent profile</p>
              <h1 className="mt-1 text-3xl font-semibold text-text">{p.name}</h1>
            </div>
            <StatusBadge variant={p.status === 'active' ? 'success' : 'pending'}>
              {p.status.replace('_', ' ')}
            </StatusBadge>
          </div>
          <p className="mt-5 text-sm leading-6 text-muted">{p.addressText}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {links.map(([label, href]) => (
              <a
                className="rounded-md border border-border px-4 py-3 text-sm font-medium text-primary hover:bg-primary-soft"
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

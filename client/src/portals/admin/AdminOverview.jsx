import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import BrandMark from '../../design-system/BrandMark.jsx';
import { navigateFromLink } from '../../navigation.js';

const todayRange = () => {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 1);
  return { from: from.toISOString(), to: to.toISOString() };
};

export default function AdminOverview() {
  const [counts, setCounts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const { from, to } = todayRange();
    Promise.all([
      api('/admin/applications?status=applied'),
      api('/admin/applications?status=in_review'),
      api('/admin/subscriptions?state=active'),
      api(
        `/admin/visits?status=completed&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      ),
      api('/admin/visits?status=flagged'),
    ])
      .then(([applied, reviewing, subscriptions, completed, flags]) => {
        setCounts({
          applications: applied.total + reviewing.total,
          completed: completed.total,
          flags: flags.total,
          subscriptions: subscriptions.items.length,
        });
      })
      .catch((requestError) => setError(requestError.message));
  }, []);

  const cards = [
    { label: 'Pending applications', path: '/admin/applications', value: counts?.applications },
    { label: 'Active subscriptions', path: '/admin/subscriptions', value: counts?.subscriptions },
    {
      label: 'Completed visits today',
      path: '/admin/visits?status=completed',
      value: counts?.completed,
    },
    { label: 'Open flags', path: '/admin/visits?status=flagged', value: counts?.flags },
  ];

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="border-b border-border pb-6">
          <BrandMark />
          <p className="mt-5 text-sm font-medium text-primary">Admin operations</p>
          <h1 className="mt-1 text-3xl font-semibold text-text">Today&apos;s overview</h1>
          <p className="mt-2 text-sm text-muted">A simple view of the work that needs attention.</p>
        </header>
        {error ? <p className="mt-5 text-sm text-emergency">{error}</p> : null}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <a
              className="rounded-lg border border-border bg-surface p-5 shadow-sm"
              href={card.path}
              key={card.label}
              onClick={(event) => navigateFromLink(event, card.path)}
            >
              <p className="text-sm text-muted">{card.label}</p>
              <p className="mt-3 text-3xl font-semibold text-text">
                {card.value === undefined ? '—' : card.value}
              </p>
            </a>
          ))}
        </section>
      </div>
    </main>
  );
}

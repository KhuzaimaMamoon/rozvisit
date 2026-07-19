import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api.js';
import BrandMark from '../../design-system/BrandMark.jsx';
import StatusBadge from '../../design-system/StatusBadge.jsx';

export default function ProofFeed() {
  const parentId = useMemo(() => window.location.pathname.split('/')[3], []);
  const [state, setState] = useState({ items: [], loading: true, error: '' });
  useEffect(() => {
    api(`/feed?parentId=${encodeURIComponent(parentId)}`)
      .then(({ items }) => setState({ items, loading: false, error: '' }))
      .catch((error) => setState({ items: [], loading: false, error: error.message }));
  }, [parentId]);
  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <header className="border-b border-border pb-6">
          <BrandMark />
          <p className="mt-5 text-sm font-medium text-primary">Care updates</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-text">Visit proof</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Completed visits show the care checklist and the camera proof recorded during the visit.
          </p>
        </header>
        <section className="mt-6 space-y-4">
          {state.loading ? (
            <p className="rounded-lg border border-border bg-surface p-5 text-sm text-muted">
              Loading care updates…
            </p>
          ) : null}
          {state.error ? (
            <p className="rounded-lg border border-emergency bg-emergency-soft p-5 text-sm text-emergency">
              {state.error}
            </p>
          ) : null}
          {!state.loading && !state.error && !state.items.length ? (
            <p className="rounded-lg border border-border bg-surface p-5 text-sm text-muted">
              No completed visit proof is available yet.
            </p>
          ) : null}
          {state.items.map((visit) => (
            <article
              className="rounded-lg border border-border bg-surface p-5 shadow-sm"
              key={visit.visitId}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold text-text">
                  {new Date(visit.scheduledAt).toLocaleDateString()}
                </p>
                <StatusBadge variant={visit.status === 'completed' ? 'success' : 'pending'}>
                  {visit.status.replace('_', ' ')}
                </StatusBadge>
              </div>
              {visit.checklistSummary ? (
                <p className="mt-3 text-sm text-muted">
                  Medication: {visit.checklistSummary.medicationTaken ? 'taken' : 'not taken'} ·
                  Mood: {visit.checklistSummary.mood}/5
                </p>
              ) : null}
              {visit.media?.length ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {visit.media.map((media) => (
                    <img
                      alt="Visit proof captured in RozVisit"
                      className="aspect-video w-full rounded-md border border-border object-cover"
                      key={media.ref}
                      src={media.ref}
                    />
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

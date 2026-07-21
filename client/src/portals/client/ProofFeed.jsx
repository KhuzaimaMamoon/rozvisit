import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api.js';
import StatusBadge from '../../design-system/StatusBadge.jsx';

const concernLabels = {
  appetite: 'Ate less than usual',
  home_condition: 'Home needs attention',
  medication: 'Medication question',
  mobility: 'Moved less than usual',
  mood_change: 'Seemed different than usual',
  other: 'Something else',
};

export default function ProofFeed({ parentId: parentIdProp = null }) {
  const parentIdFromPath = useMemo(() => window.location.pathname.split('/')[3], []);
  const parentId = parentIdProp ?? parentIdFromPath;
  const [state, setState] = useState({ items: [], loading: true, error: '' });
  useEffect(() => {
    api(`/feed?parentId=${encodeURIComponent(parentId)}`)
      .then(({ items }) => setState({ items, loading: false, error: '' }))
      .catch((error) => setState({ items: [], loading: false, error: error.message }));
  }, [parentId]);
  const newestFirst = [...state.items].sort(
    (first, second) => new Date(second.scheduledAt) - new Date(first.scheduledAt),
  );
  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-lg border border-border bg-primary-soft p-5 shadow-sm sm:p-6">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Care updates</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            Visit proof
          </h1>
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
          {newestFirst.map((visit) => (
            <article
              className="rounded-lg border border-border bg-surface p-4 shadow-sm sm:p-5"
              key={visit.visitId}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    Visit date
                  </p>
                  <p className="mt-1 break-words text-lg font-bold tracking-tight text-text sm:text-xl">
                    {new Date(visit.scheduledAt).toLocaleDateString(undefined, {
                      dateStyle: 'full',
                    })}
                  </p>
                </div>
                <StatusBadge variant={visit.status === 'completed' ? 'success' : 'pending'}>
                  {visit.status.replace('_', ' ')}
                </StatusBadge>
              </div>
              {visit.checklistSummary ? (
                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md bg-primary-soft p-3">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                      Medication
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-text">
                      {visit.checklistSummary.medicationTaken ? 'Taken' : 'Not taken'}
                    </dd>
                  </div>
                  <div className="rounded-md bg-primary-soft p-3">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted">Mood</dt>
                    <dd className="mt-1 text-sm font-medium text-text">
                      {visit.checklistSummary.mood}/5
                    </dd>
                  </div>
                  <div className="rounded-md bg-primary-soft p-3 sm:col-span-2">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                      Concerns
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-text">
                      {visit.checklistSummary.concerns?.length
                        ? visit.checklistSummary.concerns
                            .map((concern) => concernLabels[concern] ?? concern)
                            .join(', ')
                        : 'None recorded'}
                    </dd>
                  </div>
                </dl>
              ) : null}
              {visit.status === 'missed' ? (
                <dl className="mt-4 space-y-3 rounded-md bg-primary-soft p-4 text-sm">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                      Reason
                    </dt>
                    <dd className="mt-1 leading-6 text-text">
                      {visit.missedReason || 'No reason was recorded.'}
                    </dd>
                  </div>
                  {visit.makeUpPlan ? (
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                        Make-up plan
                      </dt>
                      <dd className="mt-1 leading-6 text-text">{visit.makeUpPlan}</dd>
                    </div>
                  ) : null}
                </dl>
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

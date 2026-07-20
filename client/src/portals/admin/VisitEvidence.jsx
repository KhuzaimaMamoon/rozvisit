import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api.js';
import BrandMark from '../../design-system/BrandMark.jsx';
import Button from '../../design-system/Button.jsx';
import StatusBadge from '../../design-system/StatusBadge.jsx';
import { navigate } from '../../navigation.js';

export default function VisitEvidence() {
  const visitId = useMemo(() => window.location.pathname.split('/').at(-1), []);
  const [visit, setVisit] = useState(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = () => {
    api(`/admin/visits/${visitId}`)
      .then(setVisit)
      .catch((requestError) => setError(requestError.message));
  };
  useEffect(load, [visitId]);

  async function resolveFlag(event) {
    event.preventDefault();
    setError('');
    try {
      const data = await api(`/admin/flags/${visitId}/resolve`, {
        body: JSON.stringify({ note }),
        method: 'POST',
      });
      setVisit(data);
      setMessage('Flag resolved and the original visit status restored.');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  if (!visit && !error) return <main className="portal-placeholder">Loading visit evidence…</main>;
  if (!visit) return <main className="portal-placeholder text-emergency">{error}</main>;
  const openFlag = visit.flag && !visit.flag.resolvedAt;

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <header className="border-b border-border pb-6">
          <BrandMark />
          <button
            className="mt-5 text-sm text-primary underline"
            onClick={() => navigate('/admin/visits')}
            type="button"
          >
            Back to visits
          </button>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-primary">Visit evidence</p>
              <h1 className="mt-1 text-3xl font-semibold text-text">{visit.parent?.name}</h1>
              <p className="mt-2 text-sm text-muted">
                {new Date(visit.scheduledAt).toLocaleString()} ·{' '}
                {visit.caregiver?.name ?? 'Unassigned'}
              </p>
            </div>
            <StatusBadge
              variant={
                visit.status === 'flagged'
                  ? 'emergency'
                  : visit.status === 'completed'
                    ? 'success'
                    : 'pending'
              }
            >
              {visit.status.replace('_', ' ')}
            </StatusBadge>
          </div>
        </header>
        {message ? <p className="mt-4 text-sm text-success">{message}</p> : null}
        {error ? <p className="mt-4 text-sm text-emergency">{error}</p> : null}
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <section className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-text">Checklist</h2>
            {visit.checklist ? (
              <dl className="mt-4 space-y-2 text-sm text-text">
                <div>
                  <dt className="inline text-muted">Medication: </dt>
                  <dd className="inline">
                    {visit.checklist.medicationTaken ? 'Taken' : 'Not taken'}
                  </dd>
                </div>
                <div>
                  <dt className="inline text-muted">Mood: </dt>
                  <dd className="inline">{visit.checklist.mood}/5</dd>
                </div>
                <div>
                  <dt className="inline text-muted">Concerns: </dt>
                  <dd className="inline">{visit.checklist.concerns.join(', ') || 'None'}</dd>
                </div>
                <div>
                  <dt className="inline text-muted">Note: </dt>
                  <dd className="inline">{visit.checklist.note || '—'}</dd>
                </div>
              </dl>
            ) : (
              <p className="mt-3 text-sm text-muted">No checklist saved.</p>
            )}
          </section>
          <section className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-text">Media proof</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {visit.media.map((media) => (
                <a href={media.ref} key={media.clientMediaId} rel="noreferrer" target="_blank">
                  <img
                    alt="Visit proof"
                    className="h-32 w-full rounded border border-border object-cover"
                    src={media.ref}
                  />
                  <p className="mt-1 text-xs text-muted">
                    Captured {new Date(media.capturedAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted">
                    Uploaded {new Date(media.uploadedAt).toLocaleString()}
                  </p>
                </a>
              ))}
            </div>
          </section>
          <section className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-text">Status history</h2>
            <ol className="mt-4 space-y-2 text-sm">
              {visit.statusHistory.map((entry, index) => (
                <li key={`${entry.status}-${index}`}>
                  <span className="font-medium text-text">{entry.status.replace('_', ' ')}</span>
                  <span className="text-muted">
                    {' '}
                    · {new Date(entry.at).toLocaleString()}
                    {entry.reason ? ` · ${entry.reason}` : ''}
                  </span>
                </li>
              ))}
            </ol>
          </section>
          <section className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-text">Flag</h2>
            {visit.flag ? (
              <div className="mt-3 text-sm text-text">
                <p>
                  <span className="text-muted">Reason: </span>
                  {visit.flag.reason}
                </p>
                <p className="mt-1">
                  <span className="text-muted">Raised: </span>
                  {new Date(visit.flag.raisedAt).toLocaleString()}
                </p>
                {visit.flag.resolvedAt ? (
                  <p className="mt-1">
                    <span className="text-muted">Resolved: </span>
                    {new Date(visit.flag.resolvedAt).toLocaleString()}
                  </p>
                ) : null}
                {openFlag ? (
                  <form className="mt-4 space-y-3" onSubmit={resolveFlag}>
                    <label className="block text-sm font-medium text-text">
                      Resolution note
                      <textarea
                        className="mt-1 w-full border border-border p-2"
                        onChange={(event) => setNote(event.target.value)}
                        required
                        value={note}
                      />
                    </label>
                    <Button type="submit">Resolve flag</Button>
                  </form>
                ) : (
                  <p className="mt-2 text-muted">{visit.flag.note || 'Flag resolved.'}</p>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">No flag on this visit.</p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

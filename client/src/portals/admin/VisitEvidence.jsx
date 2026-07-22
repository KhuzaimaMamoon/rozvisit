import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api.js';
import Button from '../../design-system/Button.jsx';
import { FormValidationBanner, useFormValidation } from '../../design-system/FormValidation.jsx';
import StatusBadge from '../../design-system/StatusBadge.jsx';
import { navigate } from '../../navigation.js';
import ConsentPlayback from '../../components/ConsentPlayback.jsx';
import FormTextarea from '../../design-system/FormTextarea.jsx';

export default function VisitEvidence() {
  const visitId = useMemo(() => window.location.pathname.split('/').at(-1), []);
  const [visit, setVisit] = useState(null);
  const [makeUpPlan, setMakeUpPlan] = useState('');
  const [missedReason, setMissedReason] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const missedValidation = useFormValidation();
  const resolutionValidation = useFormValidation();
  const [saving, setSaving] = useState(false);
  const [parent, setParent] = useState(null);

  const load = () => {
    api(`/admin/visits/${visitId}`)
      .then(setVisit)
      .catch((requestError) => setError(requestError.message));
  };
  useEffect(load, [visitId]);
  useEffect(() => {
    if (!visit?.parent?.id) return;
    api(`/parents/${visit.parent.id}`)
      .then(setParent)
      .catch(() => setParent(null));
  }, [visit?.parent?.id]);

  async function resolveFlag(event) {
    event.preventDefault();
    resolutionValidation.clearValidationNotice();
    if (saving) return;
    setError('');
    setSaving(true);
    try {
      const data = await api(`/admin/flags/${visitId}/resolve`, {
        body: JSON.stringify({ note }),
        method: 'POST',
      });
      setVisit(data);
      setMessage('Flag resolved and the original visit status restored.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function markMissed(event) {
    event.preventDefault();
    missedValidation.clearValidationNotice();
    if (saving) return;
    setError('');
    setMessage('');
    setSaving(true);
    try {
      const data = await api(`/admin/visits/${visitId}/mark-missed`, {
        body: JSON.stringify({ makeUpPlan: makeUpPlan || null, reason: missedReason }),
        method: 'POST',
      });
      setVisit(data);
      setMessage('Visit marked missed. The family has been notified.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  if (!visit && !error)
    return (
      <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
        <section className="mx-auto max-w-7xl rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6">
          <p className="text-sm text-muted">Loading visit evidence…</p>
        </section>
      </main>
    );
  if (!visit)
    return (
      <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
        <section className="mx-auto max-w-7xl rounded-lg border border-emergency bg-emergency-soft p-5 shadow-sm sm:p-6">
          <p className="text-sm text-emergency">{error}</p>
        </section>
      </main>
    );
  const openFlag = visit.flag && !visit.flag.resolvedAt;

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-lg border border-border bg-primary-soft p-5 shadow-sm sm:p-6">
          <button
            className="text-sm text-primary underline"
            onClick={() => navigate('/admin/visits')}
            type="button"
          >
            Back to visits
          </button>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium uppercase tracking-wide text-primary">
                Visit evidence
              </p>
              <h1 className="mt-2 break-words text-2xl font-semibold tracking-tight text-text sm:text-3xl">
                {visit.parent?.name}
              </h1>
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
        {visit.location ? (
          <a
            className="mt-4 inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-primary"
            href={`https://www.google.com/maps/search/?api=1&query=${visit.location.lat},${visit.location.lng}`}
            rel="noreferrer"
            target="_blank"
          >
            Open parent home pin
          </a>
        ) : null}
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
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
          {parent?.consent?.state === 'given' ? <ConsentPlayback parentId={parent.id} /> : null}
          <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
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
          <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
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
          {visit.status === 'scheduled' ? (
            <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-text">Mark missed</h2>
              <p className="mt-2 text-sm text-muted">
                Record what happened so the family sees an honest care update.
              </p>
              <form
                {...missedValidation.formProps}
                className="mt-4 space-y-3"
                onSubmit={markMissed}
              >
                <FormValidationBanner message={missedValidation.validationMessage} />
                <FormTextarea
                  id="missed-reason"
                  label="Reason"
                  onChange={(event) => setMissedReason(event.target.value)}
                  required
                  requiredMessage="Explain why the scheduled visit was missed."
                  value={missedReason}
                />
                <FormTextarea
                  id="make-up-plan"
                  label="Make-up plan"
                  onChange={(event) => setMakeUpPlan(event.target.value)}
                  optional
                  value={makeUpPlan}
                />
                <Button className="w-full sm:w-auto" loading={saving} type="submit">
                  Mark missed
                </Button>
              </form>
            </section>
          ) : null}
          <section className="rounded-lg border border-border bg-surface p-5 shadow-sm">
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
                  <form
                    {...resolutionValidation.formProps}
                    className="mt-4 space-y-3"
                    onSubmit={resolveFlag}
                  >
                    <FormValidationBanner message={resolutionValidation.validationMessage} />
                    <FormTextarea
                      id="resolution-note"
                      label="Resolution note"
                      onChange={(event) => setNote(event.target.value)}
                      required
                      requiredMessage="Explain how the flag was investigated and resolved."
                      value={note}
                    />
                    <Button className="w-full sm:w-auto" loading={saving} type="submit">
                      Resolve flag
                    </Button>
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

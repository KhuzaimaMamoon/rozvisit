import { useEffect, useMemo, useState } from 'react';
import { ApiError, api } from '../../api.js';
import BrandMark from '../../design-system/BrandMark.jsx';
import Button from '../../design-system/Button.jsx';
import FormInput from '../../design-system/FormInput.jsx';
import StatusBadge from '../../design-system/StatusBadge.jsx';
import {
  clearQueuedCompletions,
  queuedCompletions,
  removeCompletion,
  saveCompletion,
} from '../../offline/visitQueue.js';
import CameraCapture from './CameraCapture.jsx';
import ConsentPanel from './ConsentPanel.jsx';
import SyncStateBar from './SyncStateBar.jsx';

const CONCERN_CHIPS = [
  ['appetite', 'Ate less than usual'],
  ['mobility', 'Moved less than usual'],
  ['medication', 'Medication question'],
  ['mood_change', 'Seemed different than usual'],
  ['home_condition', 'Home needs attention'],
  ['other', 'Something else (see note)'],
];

const syncingCompletionIds = new Set();

class UploadError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function isPermanentCompletionError(error) {
  const status = error instanceof ApiError || error instanceof UploadError ? error.status : null;
  return Number.isInteger(status) && status >= 400 && status < 500;
}

async function uploadPermit(permit, blob) {
  const subtype = blob.type.split('/').at(-1)?.toLowerCase();
  const extension = subtype === 'quicktime' ? 'mov' : subtype;
  if (blob.size > permit.maxFileSize || !permit.allowedFormats.includes(extension)) {
    throw new UploadError('This camera file cannot be uploaded. Please capture it again.', 422);
  }
  const body = new FormData();
  body.append('file', blob, `${permit.clientMediaId}.jpg`);
  body.append('api_key', permit.apiKey);
  body.append('timestamp', String(permit.timestamp));
  body.append('signature', permit.signature);
  body.append('folder', permit.folder);
  body.append('public_id', permit.publicId);
  const uploadEndpoint = `https://api.cloudinary.com/v1_1/${permit.cloudName}/${permit.resourceType}/upload`;
  const response = await fetch(uploadEndpoint, {
    method: 'POST',
    body,
  });
  if (!response.ok) {
    throw new UploadError('The media upload could not be completed yet.', response.status);
  }
  return response.json();
}

async function syncCompletion(draft) {
  await api(`/visits/${draft.visitId}/checklist`, {
    body: JSON.stringify(draft.checklist),
    method: 'POST',
  });
  const { permits } = await api(`/visits/${draft.visitId}/media-permit`, {
    body: JSON.stringify({
      items: draft.captures.map(({ clientMediaId, capturedAt, mediaType }) => ({
        clientMediaId,
        capturedAt,
        mediaType,
      })),
    }),
    method: 'POST',
  });
  const media = await Promise.all(
    draft.captures.map(async (capture) => {
      const permit = permits.find((item) => item.clientMediaId === capture.clientMediaId);
      const result = await uploadPermit(permit, capture.blob);
      return {
        clientMediaId: capture.clientMediaId,
        capturedAt: capture.capturedAt,
        uploadedAt: new Date().toISOString(),
        ref: result.secure_url ?? result.public_id,
        sourceFlag: 'in_app_camera',
      };
    }),
  );
  await api(`/visits/${draft.visitId}/complete`, {
    body: JSON.stringify({
      clientVisitId: draft.clientVisitId,
      completedAt: draft.completedAt,
      media,
    }),
    method: 'POST',
  });
  await removeCompletion(draft.clientVisitId);
}

async function processQueuedCompletion(draft) {
  if (syncingCompletionIds.has(draft.clientVisitId)) return { outcome: 'in_flight' };
  syncingCompletionIds.add(draft.clientVisitId);
  try {
    await syncCompletion(draft);
    return { outcome: 'synced' };
  } catch (error) {
    if (isPermanentCompletionError(error)) {
      await removeCompletion(draft.clientVisitId);
      return { outcome: 'discarded', error };
    }
    throw error;
  } finally {
    syncingCompletionIds.delete(draft.clientVisitId);
  }
}

export default function VisitFlow() {
  const visitId = useMemo(() => window.location.pathname.split('/').at(-1), []);
  const [form, setForm] = useState({ concerns: [], medicationTaken: 'yes', mood: '3', note: '' });
  const [captures, setCaptures] = useState([]);
  const [selectedCaptureId, setSelectedCaptureId] = useState(null);
  const [state, setState] = useState({
    message: '',
    saving: false,
    sync: navigator.onLine ? 'synced' : 'pending',
  });
  const [visit, setVisit] = useState(null);
  const [visitError, setVisitError] = useState('');
  const [checklistStarted, setChecklistStarted] = useState(false);

  useEffect(() => {
    api(`/visits/${visitId}`)
      .then((data) => {
        setVisit(data);
        if (data.checklist) {
          setForm({
            concerns: data.checklist.concerns ?? [],
            medicationTaken: data.checklist.medicationTaken ? 'yes' : 'no',
            mood: String(data.checklist.mood),
            note: '',
          });
        }
      })
      .catch((error) => setVisitError(error.message));
  }, [visitId]);

  useEffect(() => {
    const retry = async () => {
      const drafts = await queuedCompletions();
      try {
        const outcomes = await Promise.all(drafts.map(processQueuedCompletion));
        const discarded = outcomes.find((item) => item.outcome === 'discarded');
        setState((current) => ({
          ...current,
          sync: 'synced',
          message: discarded
            ? 'An outdated saved attempt could not be sent and was removed.'
            : 'Connection restored. Saved work has synced.',
        }));
      } catch {
        setState((current) => ({
          ...current,
          sync: 'pending',
          message: 'Saved offline, pending upload. We will retry again when connection returns.',
        }));
      }
    };
    window.addEventListener('online', retry);
    if (navigator.onLine) void retry();
    return () => window.removeEventListener('online', retry);
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;
    window.__rozvisitOfflineQueue = {
      clear: clearQueuedCompletions,
      list: queuedCompletions,
    };
    return () => {
      delete window.__rozvisitOfflineQueue;
    };
  }, []);

  function addCapture(capture) {
    const previewUrl = URL.createObjectURL(capture.blob);
    setCaptures((items) => [...items, { ...capture, previewUrl }]);
    setState((current) => ({ ...current, message: '' }));
  }

  function updateChecklist(next) {
    setChecklistStarted(true);
    setForm((current) => ({ ...current, ...next }));
  }

  useEffect(() => {
    if (!checklistStarted || !visit || visit.consentState !== 'given') return undefined;
    const timer = window.setTimeout(() => {
      api(`/visits/${visitId}/checklist`, {
        body: JSON.stringify({
          capturedAt: new Date().toISOString(),
          concerns: form.concerns,
          medicationTaken: form.medicationTaken === 'yes',
          mood: Number(form.mood),
          note: form.note,
        }),
        method: 'POST',
      })
        .then(() => setState((current) => ({ ...current, sync: 'synced' })))
        .catch(() => setState((current) => ({ ...current, sync: 'pending' })));
    }, 700);
    return () => window.clearTimeout(timer);
  }, [checklistStarted, form, visit, visitId]);

  function removeCapture(clientMediaId) {
    setCaptures((items) => {
      const selected = items.find((item) => item.clientMediaId === clientMediaId);
      if (selected?.previewUrl) URL.revokeObjectURL(selected.previewUrl);
      return items.filter((item) => item.clientMediaId !== clientMediaId);
    });
    setSelectedCaptureId((current) => (current === clientMediaId ? null : current));
  }

  const selectedCapture = captures.find((capture) => capture.clientMediaId === selectedCaptureId);

  async function complete() {
    const capturedAt = new Date().toISOString();
    const checklist = {
      medicationTaken: form.medicationTaken === 'yes',
      mood: Number(form.mood),
      concerns: form.concerns,
      note: form.note,
      capturedAt,
    };
    const draft = {
      clientVisitId: visit.clientVisitId,
      visitId,
      checklist,
      captures,
      completedAt: new Date().toISOString(),
      state: 'waiting_to_send',
    };
    await saveCompletion(draft);
    if (!navigator.onLine) {
      setState({
        saving: false,
        sync: 'pending',
        message: 'Saved offline, pending upload. Keep RozVisit open when your connection returns.',
      });
      return;
    }
    setState((current) => ({ ...current, saving: true }));
    try {
      const result = await processQueuedCompletion(draft);
      if (result.outcome === 'discarded') {
        setState({
          saving: false,
          sync: 'synced',
          message: 'This saved attempt could not be sent and was removed.',
        });
        return;
      }
      setState({
        saving: false,
        sync: 'synced',
        message: 'Visit completed and proof is ready for the family.',
      });
    } catch {
      setState({
        saving: false,
        sync: 'pending',
        message: 'Saved offline, pending upload. We will retry when the connection returns.',
      });
    }
  }

  async function markParentDeclined() {
    try {
      await api(`/visits/${visitId}/parent-declined`, {
        body: JSON.stringify({ capturedAt: new Date().toISOString() }),
        method: 'POST',
      });
      window.location.assign('/care/today');
    } catch (error) {
      setState((current) => ({ ...current, message: error.message }));
    }
  }

  if (visitError) return <main className="portal-placeholder text-emergency">{visitError}</main>;
  if (!visit) return <main className="portal-placeholder text-muted">Loading visit details…</main>;

  return (
    <main className="min-h-screen bg-background px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl pb-28">
        <header className="rounded-xl border border-border bg-primary-soft px-5 py-5 shadow-sm sm:px-7 sm:py-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <BrandMark />
              <p className="mt-5 text-sm font-medium text-primary">Caregiver visit</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-text">
                {visit.parentName}
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted">
                {new Date(visit.scheduledAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                · {visit.addressText}
              </p>
              {visit.standingNote ? (
                <p className="mt-3 inline-flex rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-primary">
                  {visit.standingNote}
                </p>
              ) : null}
            </div>
            <div className="max-w-sm rounded-lg border border-border bg-surface/80 p-4 text-sm leading-6 text-muted">
              <p className="font-medium text-text">Care plan reminder</p>
              {visit.consentChoices ? (
                <p className="mt-1">
                  Preferred times:{' '}
                  {visit.consentChoices.preferredTimes?.join(', ') || 'Not specified'} · Photo
                  boundaries: {visit.consentChoices.photoBoundaries || 'Not specified'}
                </p>
              ) : (
                <p className="mt-1">
                  Save the checklist, then capture proof with the in-app camera.
                </p>
              )}
            </div>
          </div>
        </header>
        <div className="mt-5">
          <SyncStateBar state={state.sync} />
          {state.message ? <p className="mt-2 text-sm text-muted">{state.message}</p> : null}
        </div>
        {visit.consentState === 'pending' ? (
          <div className="mt-5">
            <ConsentPanel
              onResolved={(consentState) => {
                if (consentState === 'declined') window.location.assign('/care/today');
                setVisit((current) => ({ ...current, consentState }));
              }}
              parentId={visit.parentId}
              visitId={visit.id}
            />
          </div>
        ) : null}
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(19rem,0.8fr)_minmax(0,1.2fr)] lg:items-start">
          <section className="rounded-xl border border-border bg-surface p-5 shadow-sm lg:row-span-2 lg:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <p className="text-sm font-medium text-primary">Step 1</p>
                <h2 className="mt-1 text-xl font-semibold text-text">Visit checklist</h2>
              </div>
              <span className="rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success">
                Auto-save on
              </span>
            </div>
            <div className="mt-5 space-y-4">
              <label className="space-y-2 text-sm font-medium text-text">
                Medication taken
                <select
                  className="h-10 w-full rounded-sm border border-border bg-surface px-3 text-text"
                  onChange={(event) => updateChecklist({ medicationTaken: event.target.value })}
                  value={form.medicationTaken}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
              <fieldset>
                <legend className="text-sm font-medium text-text">Mood (1–5)</legend>
                <div className="mt-2 flex gap-2">
                  {[1, 2, 3, 4, 5].map((mood) => (
                    <button
                      aria-label={`Mood ${mood}`}
                      className={`h-11 min-w-11 rounded-full border text-sm font-semibold ${Number(form.mood) === mood ? 'border-primary bg-primary text-surface' : 'border-border bg-surface text-text'}`}
                      key={mood}
                      onClick={() => updateChecklist({ mood: String(mood) })}
                      type="button"
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="text-sm font-medium text-text">Concerns</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CONCERN_CHIPS.map(([value, label]) => (
                    <button
                      className={`min-h-11 rounded-full border px-3 text-sm ${form.concerns.includes(value) ? 'border-primary bg-primary text-surface' : 'border-primary bg-primary-soft text-primary'}`}
                      key={value}
                      onClick={() =>
                        updateChecklist({
                          concerns: form.concerns.includes(value)
                            ? form.concerns.filter((item) => item !== value)
                            : [...form.concerns, value],
                        })
                      }
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <FormInput
                id="note"
                label="Short note"
                onChange={(event) => updateChecklist({ note: event.target.value })}
                optional
                value={form.note}
              />
            </div>
            <div className="mt-6 border-t border-border pt-4 text-sm leading-6 text-muted">
              Checklist changes save automatically. Capture at least one in-app camera photo to
              complete this visit.
            </div>
          </section>
          <div className="min-h-[32rem]">
            <CameraCapture
              captureLimitReached={captures.length >= 5}
              disabled={state.saving}
              onCapture={addCapture}
            />
          </div>
          <aside className="flex min-h-56 flex-col rounded-xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <p className="text-sm font-semibold text-text">Captured proof</p>
                <p className="mt-1 text-xs text-muted">Select a photo to review it.</p>
              </div>
              <StatusBadge variant={captures.length ? 'success' : 'neutral'}>
                {captures.length}/5
              </StatusBadge>
            </div>
            {captures.length ? (
              <div className="mt-4 grid grid-cols-3 content-start gap-3 sm:grid-cols-5">
                {captures.map((capture) => (
                  <div className="relative" key={capture.clientMediaId}>
                    <button
                      aria-label={`Review captured photo at ${new Date(capture.capturedAt).toLocaleTimeString()}`}
                      className="block w-full overflow-hidden rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/25"
                      onClick={() => setSelectedCaptureId(capture.clientMediaId)}
                      type="button"
                    >
                      <img
                        alt="Captured visit proof"
                        className="aspect-square w-full object-cover"
                        src={capture.previewUrl}
                      />
                    </button>
                    <button
                      aria-label="Remove captured photo"
                      className="absolute -right-1 -top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-surface text-sm font-medium text-text shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
                      onClick={() => removeCapture(capture.clientMediaId)}
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid flex-1 place-items-center px-3 text-center">
                <p className="text-sm leading-6 text-muted">
                  Photos captured during this visit will stay here for review before completion.
                </p>
              </div>
            )}
          </aside>
        </div>
        <div className="sticky bottom-3 z-10 mt-6 flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <span className="text-sm leading-6 text-muted">
            Review: medication {form.medicationTaken}, mood {form.mood}/5, {form.concerns.length}{' '}
            concern{form.concerns.length === 1 ? '' : 's'}, and {captures.length} photo
            {captures.length === 1 ? '' : 's'}.
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              disabled={state.saving || visit.consentState !== 'given'}
              onClick={markParentDeclined}
              variant="ghost"
            >
              Parent declined
            </Button>
            <Button
              caregiver
              disabled={!captures.length || visit.consentState !== 'given'}
              loading={state.saving}
              onClick={complete}
            >
              Complete visit
            </Button>
          </div>
        </div>
        {selectedCapture ? (
          <div className="fixed inset-0 z-20 grid place-items-center bg-text/90 p-6">
            <div className="relative max-h-full max-w-4xl rounded-lg border border-border bg-surface p-4 shadow-lg">
              <button
                aria-label="Close photo review"
                className="absolute right-2 top-2 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface text-lg font-medium text-text shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/25"
                onClick={() => setSelectedCaptureId(null)}
                type="button"
              >
                ×
              </button>
              <img
                alt="Full-size captured visit proof"
                className="max-h-[78vh] max-w-full rounded-md object-contain"
                src={selectedCapture.previewUrl}
              />
              <p className="mt-3 text-sm text-muted">
                Captured{' '}
                {new Date(selectedCapture.capturedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

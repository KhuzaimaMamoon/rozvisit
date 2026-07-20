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
  const [form, setForm] = useState({ medicationTaken: 'yes', mood: '3', note: '' });
  const [captures, setCaptures] = useState([]);
  const [selectedCaptureId, setSelectedCaptureId] = useState(null);
  const [state, setState] = useState({
    message: '',
    saving: false,
    sync: navigator.onLine ? 'synced' : 'pending',
  });

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
      concerns: [],
      note: form.note,
      capturedAt,
    };
    const draft = {
      clientVisitId: visitId,
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

  return (
    <main className="min-h-screen bg-background px-4 py-4 sm:px-6 sm:py-5 lg:h-screen lg:overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:h-full lg:min-h-0">
        <header className="flex flex-none flex-col items-start gap-4 rounded-lg border border-border bg-primary-soft px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <BrandMark />
            <p className="mt-3 text-sm font-medium text-primary">Caregiver visit</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text">
              Complete today&apos;s care
            </h1>
          </div>
          <div className="flex max-w-xs flex-col items-start gap-3 sm:items-end">
            <p className="text-sm leading-6 text-muted sm:text-right">
              Save the checklist, then capture proof with the in-app camera.
            </p>
            <div className="hidden lg:block">
              <Button
                caregiver
                disabled={!captures.length}
                loading={state.saving}
                onClick={complete}
              >
                Complete visit
              </Button>
            </div>
          </div>
        </header>
        <div className="mt-5 grid min-h-0 flex-1 gap-5 lg:grid-cols-[0.82fr_1.35fr_0.62fr] lg:items-stretch">
          <section className="flex min-h-0 flex-col rounded-lg border border-border bg-surface p-5 shadow-sm lg:h-full">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-text">Visit checklist</h2>
            </div>
            <div className="mt-5 space-y-4">
              <label className="space-y-2 text-sm font-medium text-text">
                Medication taken
                <select
                  className="h-10 w-full rounded-sm border border-border bg-surface px-3 text-text"
                  onChange={(event) => setForm({ ...form, medicationTaken: event.target.value })}
                  value={form.medicationTaken}
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
              <FormInput
                id="mood"
                label="Mood (1–5)"
                max="5"
                min="1"
                onChange={(event) => setForm({ ...form, mood: event.target.value })}
                type="number"
                value={form.mood}
              />
              <FormInput
                id="note"
                label="Short note"
                onChange={(event) => setForm({ ...form, note: event.target.value })}
                optional
                value={form.note}
              />
            </div>
            <div className="mt-auto border-t border-border pt-4 text-sm leading-6 text-muted">
              Save the checklist, then capture at least one photo in the in-app camera to complete
              this visit.
            </div>
          </section>
          <div className="min-h-[28rem] lg:min-h-0">
            <CameraCapture
              captureLimitReached={captures.length >= 5}
              disabled={state.saving}
              onCapture={addCapture}
            />
          </div>
          <aside className="flex min-h-56 flex-col rounded-lg border border-border bg-surface p-4 shadow-sm lg:min-h-0">
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
              <div className="mt-3 grid grid-cols-3 content-start gap-3 sm:grid-cols-4 lg:min-h-0 lg:grid-cols-2 lg:overflow-y-auto lg:pr-1">
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
        <div className="mt-5 lg:hidden">
          <Button
            caregiver
            className="w-full"
            disabled={!captures.length}
            loading={state.saving}
            onClick={complete}
          >
            Complete visit
          </Button>
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

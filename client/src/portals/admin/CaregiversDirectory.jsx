import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import Button from '../../design-system/Button.jsx';
import StatusBadge from '../../design-system/StatusBadge.jsx';

function statusVariant(status) {
  return status === 'verified' ? 'success' : status === 'rejected' ? 'emergency' : 'pending';
}

function date(value) {
  return value ? new Date(value).toLocaleDateString() : 'Not recorded';
}

function GateSummary({ gates }) {
  return (
    <span className="text-sm text-muted">
      CNIC {gates.cnic ? 'complete' : 'pending'} · Interview{' '}
      {gates.interview ? 'complete' : 'pending'} · Reference{' '}
      {gates.reference ? 'complete' : 'pending'}
    </span>
  );
}

export default function CaregiversDirectory() {
  const [state, setState] = useState({ error: '', items: [], loading: true });
  const [revealed, setRevealed] = useState({});
  const [revealingId, setRevealingId] = useState('');

  useEffect(() => {
    api('/admin/caregivers?limit=100')
      .then(({ items }) => setState({ error: '', items, loading: false }))
      .catch((error) => setState({ error: error.message, items: [], loading: false }));
  }, []);

  async function toggleCnic(caregiver) {
    if (revealed[caregiver.id]) {
      setRevealed((current) => {
        const next = { ...current };
        delete next[caregiver.id];
        return next;
      });
      return;
    }
    setRevealingId(caregiver.id);
    try {
      const data = await api(`/admin/caregivers/${caregiver.id}/cnic`);
      setRevealed((current) => ({ ...current, [caregiver.id]: data.cnicNumber }));
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }));
    } finally {
      setRevealingId('');
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-lg border border-border bg-primary-soft p-5 shadow-sm sm:p-6">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            Admin directory
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            Caregivers
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Find registered caregivers, their verification progress, and service areas.
          </p>
        </header>
        <section className="mt-6 rounded-lg border border-border bg-surface shadow-sm">
          {state.loading ? <p className="p-5 text-sm text-muted">Loading caregivers…</p> : null}
          {state.error ? <p className="p-5 text-sm text-emergency">{state.error}</p> : null}
          {!state.loading && !state.error && !state.items.length ? (
            <p className="p-5 text-sm text-muted">No caregivers are registered yet.</p>
          ) : null}
          {state.items.map((caregiver) => (
            <article className="border-b border-border p-5 last:border-b-0" key={caregiver.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-text">{caregiver.user.name}</h2>
                  <p className="mt-1 text-sm text-muted">
                    {caregiver.user.email} · {caregiver.user.phone}
                  </p>
                </div>
                <StatusBadge variant={statusVariant(caregiver.status)}>
                  {caregiver.status.replace('_', ' ')}
                </StatusBadge>
              </div>
              <div className="mt-4 grid gap-3 text-sm text-muted sm:grid-cols-2 lg:grid-cols-4">
                <p>
                  <span className="font-medium text-text">Service area: </span>
                  {caregiver.serviceArea.lat}, {caregiver.serviceArea.lng} ·{' '}
                  {caregiver.serviceArea.radiusKm} km
                </p>
                <p>
                  <span className="font-medium text-text">Applied: </span>
                  {date(caregiver.applicationCreatedAt)}
                </p>
                <p>
                  <span className="font-medium text-text">Decision: </span>
                  {date(caregiver.verification.decidedAt)}
                </p>
                <GateSummary gates={caregiver.gates} />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button
                  loading={revealingId === caregiver.id}
                  onClick={() => void toggleCnic(caregiver)}
                  variant="secondary"
                >
                  {revealed[caregiver.id] ? 'Hide CNIC' : 'View CNIC'}
                </Button>
                {revealed[caregiver.id] ? (
                  <p className="rounded-md border border-border bg-primary-soft px-3 py-2 text-sm text-text">
                    <span className="font-medium">Viewing this record is logged.</span> CNIC:{' '}
                    {revealed[caregiver.id]}
                  </p>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

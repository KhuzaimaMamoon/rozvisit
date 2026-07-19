import { useState } from 'react';
import Button from '../../design-system/Button.jsx';
import FormInput from '../../design-system/FormInput.jsx';

export default function VisitFlow() {
  const [consent, setConsent] = useState('');
  const [saved, setSaved] = useState(false);
  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-3xl">
        <header className="border-b border-border pb-6">
          <p className="text-lg font-semibold text-primary">RozVisit</p>
          <p className="mt-5 text-sm font-medium text-primary">First visit</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-text">
            Ask before you begin
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Explain the visit clearly. The parent chooses whether visits and photos are acceptable.
          </p>
        </header>
        <section className="mt-6 rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-text">Consent</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Button
              onClick={() => setConsent('given')}
              variant={consent === 'given' ? 'primary' : 'secondary'}
            >
              Consent given
            </Button>
            <Button
              onClick={() => setConsent('declined')}
              variant={consent === 'declined' ? 'primary' : 'secondary'}
            >
              Parent declined
            </Button>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted">
            Record the parent&apos;s preferences, including preferred times and photo boundaries,
            before continuing.
          </p>
        </section>
        {consent === 'given' ? (
          <section className="mt-6 rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-text">Visit checklist</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <FormInput id="medication" label="Medication taken" />
              <FormInput id="mood" label="Mood (1–5)" type="number" min="1" max="5" />
            </div>
            <FormInput className="mt-5" id="note" label="Short note" optional />
            <div className="mt-6 flex justify-end border-t border-border pt-5">
              <Button onClick={() => setSaved(true)}>Save checklist</Button>
            </div>
          </section>
        ) : null}
        {consent === 'declined' ? (
          <section className="mt-6 border-l-[3px] border-pending bg-pending-soft p-5 text-sm text-pending">
            The visit will be closed without fault. The client will receive an honest update.
          </section>
        ) : null}
        {saved ? (
          <p className="mt-5 border-l-[3px] border-success bg-success-soft p-4 text-sm text-success">
            Checklist saved. Camera capture and completion are available in the next visit update.
          </p>
        ) : null}
      </div>
    </main>
  );
}

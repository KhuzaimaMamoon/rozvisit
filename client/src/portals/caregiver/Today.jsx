import StatusBadge from '../../design-system/StatusBadge.jsx';

export default function Today() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <header className="border-b border-border pb-6">
          <p className="text-lg font-semibold text-primary">RozVisit</p>
          <p className="mt-5 text-sm font-medium text-primary">Caregiver portal</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-text">
            Today&apos;s visits
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Your assigned visits are saved for offline viewing.
          </p>
        </header>
        <section className="mt-6 rounded-lg border border-border bg-surface p-6 shadow-sm">
          <p className="text-lg font-semibold text-text">No visits today</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            When a visit is assigned to you, it will appear here with its time and location.
          </p>
          <div className="mt-5 border-t border-border pt-5">
            <StatusBadge variant="neutral">Saved for offline viewing</StatusBadge>
          </div>
        </section>
      </div>
    </main>
  );
}

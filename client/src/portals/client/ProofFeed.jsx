import BrandMark from '../../design-system/BrandMark.jsx';
import StatusBadge from '../../design-system/StatusBadge.jsx';

export default function ProofFeed() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <header className="border-b border-border pb-6">
          <BrandMark />
          <p className="mt-5 text-sm font-medium text-primary">Care updates</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-text">Visit proof</h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Completed visits will appear here with their checklist summary and photos.
          </p>
        </header>
        <section className="mt-6 rounded-lg border border-border bg-surface p-6 shadow-sm">
          <p className="text-sm font-semibold text-text">
            Your first visit is scheduled for Tuesday at 10:00.
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Once a visit is completed, you will see an honest update here. Photos are shown after
            they finish uploading.
          </p>
          <div className="mt-5 flex items-center gap-3 border-t border-border pt-5">
            <StatusBadge variant="pending">Scheduled</StatusBadge>
            <span className="text-sm text-muted">A caregiver will be assigned shortly.</span>
          </div>
        </section>
      </div>
    </main>
  );
}

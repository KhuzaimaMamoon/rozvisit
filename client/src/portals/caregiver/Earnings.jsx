export default function Earnings() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-lg border border-border bg-primary-soft p-5 shadow-sm sm:p-6">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            Caregiver portal
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            Earnings
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            A clear record of your verified visit earnings.
          </p>
        </header>
        <section className="mt-6 rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6">
          <p className="text-lg font-semibold text-text">No earnings recorded yet</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Your first earning shows here after your first verified visit. Earnings details are
            coming soon.
          </p>
        </section>
      </div>
    </main>
  );
}

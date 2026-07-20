import BrandMark from '../../design-system/BrandMark.jsx';
export default function Earnings() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
      <section className="mx-auto max-w-3xl rounded-lg border border-border bg-surface p-6 shadow-sm">
        <BrandMark />
        <p className="mt-6 text-sm font-medium text-primary">Caregiver portal</p>
        <h1 className="mt-1 text-3xl font-semibold text-text">Earnings</h1>
        <p className="mt-5 text-sm leading-6 text-muted">
          Your first earning shows here after your first verified visit.
        </p>
        <p className="mt-2 text-sm leading-6 text-muted">Earnings details are coming soon.</p>
      </section>
    </main>
  );
}

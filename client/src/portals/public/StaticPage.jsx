import BrandMark from '../../design-system/BrandMark.jsx';

export default function StaticPage({ title }) {
  return (
    <main className="portal-placeholder bg-background px-4">
      <section className="w-full max-w-xl rounded-lg border border-border bg-surface p-6 shadow-sm">
        <BrandMark />
        <h1 className="mt-6 text-2xl font-semibold text-text">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          This page is being finalized. Please check back soon.
        </p>
        <a className="mt-6 inline-block text-sm font-medium text-primary underline" href="/login">
          Back to login
        </a>
      </section>
    </main>
  );
}

import BrandMark from '../../design-system/BrandMark.jsx';

const trustPoints = Object.freeze([
  'Caregivers are checked: CNIC, interview, and references.',
  'Camera proof and the parent’s own-words consent keep every first visit honest.',
  'Visits work offline and sync when the connection returns.',
]);

export default function PublicAuthLayout({ children, subtitle, title }) {
  return (
    <main className="min-h-dvh bg-surface sm:bg-background sm:p-5 lg:h-dvh lg:overflow-hidden lg:p-6">
      <div className="mx-auto grid min-h-dvh max-w-6xl bg-surface sm:min-h-[calc(100dvh-40px)] sm:overflow-hidden sm:rounded-lg sm:border sm:border-border sm:shadow-sm lg:h-[calc(100dvh-48px)] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <aside className="hidden flex-col justify-between bg-primary-soft p-8 lg:flex xl:p-12">
          <div>
            <BrandMark />
            <p className="mt-8 text-sm font-medium text-primary">
              Care coordination for families abroad
            </p>
            <h2 className="mt-4 max-w-sm text-3xl font-semibold tracking-tight text-text">
              Care that stays clear and accountable.
            </h2>
            <p className="mt-4 max-w-sm text-base leading-6 text-muted">
              Follow the care that matters, without carrying the practical details alone.
            </p>
          </div>
          <ul className="space-y-5" aria-label="RozVisit commitments">
            {trustPoints.map((point) => (
              <li className="flex items-start gap-3 text-sm leading-6 text-muted" key={point}>
                <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </aside>
        <section className="min-h-0 lg:flex lg:items-center lg:justify-center lg:px-12">
          <div className="w-full max-w-md lg:mx-auto">
            <div className="flex h-16 items-center border-b border-border bg-primary-soft px-5 sm:px-8 lg:hidden">
              <BrandMark />
            </div>
            <div className="px-5 py-7 sm:px-8 sm:py-8 lg:px-0 lg:py-0">
              <div className="lg:hidden">
                <h1 className="text-2xl font-semibold tracking-tight text-text">{title}</h1>
                <p className="mt-2 text-sm leading-6 text-muted">{subtitle}</p>
              </div>
              <div className="hidden lg:block">
                <h1 className="text-3xl font-semibold tracking-tight text-text">{title}</h1>
                <p className="mt-2 text-sm leading-6 text-muted">{subtitle}</p>
              </div>
              {children}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

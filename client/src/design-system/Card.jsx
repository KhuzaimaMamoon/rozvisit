export default function Card({ children, title }) {
  return (
    <section className="rounded-md border border-border bg-surface p-4 shadow-sm sm:p-5">
      {title ? <h2 className="text-lg font-semibold text-text">{title}</h2> : null}
      {children}
    </section>
  );
}

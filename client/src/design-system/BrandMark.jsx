export default function BrandMark({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 text-primary ${className}`}>
      <img
        alt=""
        aria-hidden="true"
        className="h-14 w-10 shrink-0 object-contain"
        src="/brand/rozvisit-mark-cropped.png"
      />
      <span className="text-2xl font-semibold leading-none tracking-tight text-primary">
        RozVisit
      </span>
    </span>
  );
}

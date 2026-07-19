const variants = Object.freeze({
  success: 'bg-success-soft text-success',
  pending: 'bg-pending-soft text-pending',
  emergency: 'bg-emergency-soft text-emergency',
  neutral: 'bg-primary-soft text-primary',
});

export default function StatusBadge({ children, variant = 'neutral' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${variants[variant]}`}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

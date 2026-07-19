const variants = Object.freeze({
  success: 'bg-success-soft text-success',
  pending: 'bg-pending-soft text-pending',
  emergency: 'bg-emergency-soft text-emergency',
  neutral: 'bg-primary-soft text-primary',
});

export default function StatusBadge({ children, variant = 'neutral' }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}

const variants = Object.freeze({
  primary: 'bg-primary text-surface hover:bg-primary-hover',
  secondary: 'border border-border bg-surface text-text hover:bg-surface-sunken',
  accent: 'border border-accent bg-accent text-text hover:bg-primary-soft',
  ghost: 'bg-transparent text-primary hover:bg-primary-soft',
  emergency: 'bg-emergency text-surface hover:bg-emergency-hover',
});

export default function Button({
  children,
  disabled = false,
  loading = false,
  type = 'button',
  variant = 'primary',
  caregiver = false,
  className = '',
  ...props
}) {
  const isDisabled = disabled || loading;
  const height = caregiver ? 'min-h-11' : 'h-10';

  return (
    <button
      {...props}
      aria-busy={loading || undefined}
      className={`inline-flex ${height} items-center justify-center rounded-md px-4 text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      disabled={isDisabled}
      type={type}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2" aria-live="polite">
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          />
          <span className="sr-only">Loading</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}

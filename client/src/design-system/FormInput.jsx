export default function FormInput({
  error,
  helperText,
  id,
  label,
  optional = false,
  trailingAction,
  ...props
}) {
  const describedBy = error ? `${id}-error` : helperText ? `${id}-helper` : undefined;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text" htmlFor={id}>
        {label}
        {optional ? <span className="text-muted"> (optional)</span> : null}
      </label>
      <div className="relative">
        <input
          {...props}
          aria-describedby={describedBy}
          aria-invalid={error ? 'true' : undefined}
          className={`h-10 w-full rounded-sm border bg-surface px-3 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:bg-surface-sunken ${trailingAction ? 'pr-12' : ''} ${error ? 'border-emergency' : 'border-border focus:border-primary'}`}
          id={id}
        />
        {trailingAction ? (
          <div className="absolute inset-y-0 right-2 flex items-center">{trailingAction}</div>
        ) : null}
      </div>
      {error ? (
        <p className="text-xs text-emergency" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
      {!error && helperText ? (
        <p className="text-xs text-muted" id={`${id}-helper`}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

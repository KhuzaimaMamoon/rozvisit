import { useEffect, useState } from 'react';

export default function FormTextarea({
  error,
  helperText,
  id,
  label,
  optional = false,
  requiredMessage,
  ...props
}) {
  const [nativeError, setNativeError] = useState('');
  const [showExternalError, setShowExternalError] = useState(Boolean(error));
  useEffect(() => setShowExternalError(Boolean(error)), [error]);
  const message = (showExternalError && error) || nativeError;
  const describedBy = message ? `${id}-error` : helperText ? `${id}-helper` : undefined;
  const { onChange, onInvalid, ...textareaProps } = props;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text" htmlFor={id}>
        {label}
        {optional ? <span className="text-muted"> (optional)</span> : null}
      </label>
      <textarea
        {...textareaProps}
        aria-describedby={describedBy}
        aria-invalid={message ? 'true' : undefined}
        className={`min-h-24 w-full rounded-sm border bg-surface px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/25 ${message ? 'border-emergency focus:ring-emergency/20' : 'border-border focus:border-primary'}`}
        data-validation-label={label}
        id={id}
        onChange={(event) => {
          setNativeError('');
          setShowExternalError(false);
          onChange?.(event);
        }}
        onInvalid={(event) => {
          event.preventDefault();
          setNativeError(requiredMessage || `Enter ${label.toLowerCase()}.`);
          onInvalid?.(event);
        }}
      />
      {message ? (
        <p className="text-xs text-emergency" id={`${id}-error`}>
          {message}
        </p>
      ) : null}
      {!message && helperText ? (
        <p className="text-xs text-muted" id={`${id}-helper`}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

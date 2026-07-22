import { useEffect, useState } from 'react';

function validationMessage(input, { formatMessage, label, requiredMessage }) {
  const fieldName = label.toLowerCase();
  if (input.validity.valueMissing) return requiredMessage || `Enter ${fieldName}.`;
  if (input.validity.typeMismatch && input.type === 'email')
    return 'Enter a valid email, like name@example.com.';
  if (input.validity.typeMismatch && input.type === 'url')
    return formatMessage || 'Enter a complete link beginning with https://.';
  if (input.validity.tooShort)
    return formatMessage || `${label} must contain at least ${input.minLength} characters.`;
  if (input.validity.patternMismatch)
    return formatMessage || `Enter ${fieldName} in the format shown.`;
  if (input.validity.rangeUnderflow)
    return formatMessage || `${label} must be at least ${input.min}.`;
  if (input.validity.rangeOverflow)
    return formatMessage || `${label} must be no greater than ${input.max}.`;
  if (input.validity.stepMismatch) return formatMessage || `Enter a valid ${fieldName}.`;
  return formatMessage || `Check ${fieldName} and use the format shown.`;
}

export default function FormInput({
  error,
  formatMessage,
  helperText,
  id,
  label,
  optional = false,
  requiredMessage,
  trailingAction,
  ...props
}) {
  const [nativeError, setNativeError] = useState('');
  const [showExternalError, setShowExternalError] = useState(Boolean(error));
  useEffect(() => setShowExternalError(Boolean(error)), [error]);
  const message = (showExternalError && error) || nativeError;
  const describedBy = message ? `${id}-error` : helperText ? `${id}-helper` : undefined;
  const { onChange, onInvalid, ...inputProps } = props;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text" htmlFor={id}>
        {label}
        {optional ? <span className="text-muted"> (optional)</span> : null}
      </label>
      <div className="relative">
        <input
          {...inputProps}
          aria-describedby={describedBy}
          aria-invalid={message ? 'true' : undefined}
          data-validation-label={label}
          className={`h-10 w-full rounded-sm border bg-surface px-3 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:bg-surface-sunken ${trailingAction ? 'pr-12' : ''} ${message ? 'border-emergency focus:border-emergency focus:ring-emergency/20' : 'border-border focus:border-primary'}`}
          id={id}
          onChange={(event) => {
            setNativeError('');
            setShowExternalError(false);
            onChange?.(event);
          }}
          onInvalid={(event) => {
            event.preventDefault();
            setNativeError(
              validationMessage(event.currentTarget, { formatMessage, label, requiredMessage }),
            );
            onInvalid?.(event);
          }}
        />
        {trailingAction ? (
          <div className="absolute inset-y-0 right-2 flex items-center">{trailingAction}</div>
        ) : null}
      </div>
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

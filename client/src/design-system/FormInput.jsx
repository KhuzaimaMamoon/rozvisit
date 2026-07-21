import { useState } from 'react';

function validationMessage(input, requiredMessage) {
  if (input.validity.valueMissing) return requiredMessage || 'This field is required.';
  if (input.validity.typeMismatch && input.type === 'email') return 'Enter a valid email address.';
  if (input.validity.tooShort) return `Use at least ${input.minLength} characters.`;
  if (input.validity.patternMismatch) return 'Enter a value in the required format.';
  if (input.validity.rangeUnderflow) return `Use a value of at least ${input.min}.`;
  if (input.validity.rangeOverflow) return `Use a value no greater than ${input.max}.`;
  return input.validationMessage || 'Check this field and try again.';
}

export default function FormInput({
  error,
  helperText,
  id,
  label,
  optional = false,
  requiredMessage,
  trailingAction,
  ...props
}) {
  const [nativeError, setNativeError] = useState('');
  const message = error || nativeError;
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
          className={`h-10 w-full rounded-sm border bg-surface px-3 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:bg-surface-sunken ${trailingAction ? 'pr-12' : ''} ${message ? 'border-emergency focus:border-emergency focus:ring-emergency/20' : 'border-border focus:border-primary'}`}
          id={id}
          onChange={(event) => {
            setNativeError('');
            onChange?.(event);
          }}
          onInvalid={(event) => {
            event.preventDefault();
            setNativeError(validationMessage(event.currentTarget, requiredMessage));
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

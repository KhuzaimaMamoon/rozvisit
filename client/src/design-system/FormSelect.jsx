import { useEffect, useState } from 'react';

export default function FormSelect({ error, id, label, requiredMessage, children, ...props }) {
  const [nativeError, setNativeError] = useState('');
  const [showExternalError, setShowExternalError] = useState(Boolean(error));
  useEffect(() => setShowExternalError(Boolean(error)), [error]);
  const message = (showExternalError && error) || nativeError;
  const { onChange, onInvalid, ...selectProps } = props;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text" htmlFor={id}>
        {label}
      </label>
      <select
        {...selectProps}
        aria-describedby={message ? `${id}-error` : undefined}
        aria-invalid={message ? 'true' : undefined}
        className={`h-10 w-full rounded-sm border bg-surface px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/25 ${message ? 'border-emergency focus:ring-emergency/20' : 'border-border focus:border-primary'}`}
        data-validation-label={label}
        id={id}
        onChange={(event) => {
          setNativeError('');
          setShowExternalError(false);
          onChange?.(event);
        }}
        onInvalid={(event) => {
          event.preventDefault();
          setNativeError(requiredMessage || `Select ${label.toLowerCase()}.`);
          onInvalid?.(event);
        }}
      >
        {children}
      </select>
      {message ? (
        <p className="text-xs text-emergency" id={`${id}-error`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}

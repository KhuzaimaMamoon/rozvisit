import { useCallback, useRef, useState } from 'react';

function focusFirstInvalid(form) {
  const field = form?.querySelector(':invalid, [aria-invalid="true"]');
  if (!field) return;
  field.scrollIntoView({ behavior: 'smooth', block: 'center' });
  field.focus({ preventScroll: true });
}

export function useFormValidation() {
  const formRef = useRef(null);
  const [message, setMessage] = useState('');

  const revealFirstInvalid = useCallback(() => {
    setMessage('Please fill in the required information below.');
    window.requestAnimationFrame(() => focusFirstInvalid(formRef.current));
  }, []);

  const onInvalidCapture = useCallback(
    (event) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLSelectElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        revealFirstInvalid();
      }
    },
    [revealFirstInvalid],
  );

  return {
    clearValidationNotice: () => setMessage(''),
    formProps: { onInvalidCapture, ref: formRef },
    revealFirstInvalid,
    validationMessage: message,
  };
}

export function FormValidationBanner({ message }) {
  if (!message) return null;
  return (
    <p
      className="rounded-r-md border-l-[3px] border-emergency bg-emergency-soft p-4 text-sm leading-6 text-emergency"
      role="alert"
    >
      {message}
    </p>
  );
}

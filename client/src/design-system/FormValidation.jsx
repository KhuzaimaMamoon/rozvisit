import { useCallback, useRef, useState } from 'react';

function invalidFields(form) {
  if (!form) return [];
  return [...form.querySelectorAll(':invalid, [aria-invalid="true"]')].filter(
    (field, index, fields) => !field.disabled && fields.indexOf(field) === index,
  );
}

function fieldLabel(field) {
  const explicit = field.dataset.validationLabel || field.getAttribute('aria-label');
  if (explicit) return explicit;
  const label = field.labels?.[0] ?? null;
  return label?.textContent?.replace(/\s*\(optional\)\s*/i, '').trim() || field.name || 'Field';
}

function focusFirstInvalid(form) {
  const [field] = invalidFields(form);
  if (!field) return;
  field.scrollIntoView({ behavior: 'smooth', block: 'center' });
  field.focus({ preventScroll: true });
}

function summaryFor(form, fallbackLabels = []) {
  const labels = invalidFields(form).map(fieldLabel);
  const uniqueLabels = [...new Set(labels.length ? labels : fallbackLabels)];
  return uniqueLabels.length
    ? `Please fix: ${uniqueLabels.join(', ')}.`
    : 'Please review the highlighted information.';
}

export function useFormValidation() {
  const formRef = useRef(null);
  const [message, setMessage] = useState('');

  const revealFirstInvalid = useCallback((fallbackLabels = []) => {
    setMessage(summaryFor(formRef.current, fallbackLabels));
    window.requestAnimationFrame(() =>
      window.requestAnimationFrame(() => {
        setMessage(summaryFor(formRef.current, fallbackLabels));
        focusFirstInvalid(formRef.current);
      }),
    );
  }, []);

  const onInvalidCapture = useCallback(
    (event) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLSelectElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        event.preventDefault();
        event.target.setAttribute('aria-invalid', 'true');
        revealFirstInvalid();
      }
    },
    [revealFirstInvalid],
  );

  return {
    clearValidationNotice: () => setMessage(''),
    formProps: {
      noValidate: false,
      onInputCapture: (event) => {
        // Reading validity is side-effect free. Calling checkValidity() here would
        // dispatch an `invalid` event during typing/autofill, before submission.
        if (event.target.validity?.valid) {
          event.target.removeAttribute('aria-invalid');
        }
        window.requestAnimationFrame(() => {
          const nextMessage = summaryFor(formRef.current);
          setMessage(invalidFields(formRef.current).length ? nextMessage : '');
        });
      },
      onInvalidCapture,
      ref: formRef,
    },
    revealFirstInvalid,
    validationMessage: message,
  };
}

export function FormValidationBanner({ message }) {
  if (!message) return null;
  return (
    <p
      className="sticky top-3 z-30 rounded-r-md border-l-[3px] border-emergency bg-emergency-soft p-4 text-sm font-medium leading-6 text-emergency shadow-sm"
      role="alert"
    >
      {message}
    </p>
  );
}

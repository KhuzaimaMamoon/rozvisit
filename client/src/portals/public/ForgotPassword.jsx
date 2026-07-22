import { useState } from 'react';
import { api } from '../../api.js';
import Button from '../../design-system/Button.jsx';
import FormInput from '../../design-system/FormInput.jsx';
import { FormValidationBanner, useFormValidation } from '../../design-system/FormValidation.jsx';
import PublicAuthLayout from './PublicAuthLayout.jsx';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { clearValidationNotice, formProps, validationMessage } = useFormValidation();

  async function submit(event) {
    event.preventDefault();
    clearValidationNotice();
    setError('');
    setLoading(true);
    try {
      await api('/auth/forgot', { body: JSON.stringify({ email }), method: 'POST', retry: false });
      setSent(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicAuthLayout
      subtitle="We will help you get back into your account."
      title="Reset your password"
    >
      {sent ? (
        <div
          className="mt-7 border-l-[3px] border-success bg-success-soft px-4 py-3 text-sm leading-6 text-success"
          role="status"
        >
          If an account exists for that email, we&apos;ve sent reset instructions. Please also check
          your spam or junk folder.
        </div>
      ) : (
        <form {...formProps} className="mt-7 space-y-5" onSubmit={submit}>
          <FormValidationBanner message={validationMessage} />
          {error ? (
            <p
              className="border-l-[3px] border-emergency bg-emergency-soft px-4 py-3 text-sm text-emergency"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          <FormInput
            autoComplete="email"
            id="email"
            label="Email"
            requiredMessage="Enter a valid email, like name@example.com."
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
          <Button className="w-full" loading={loading} type="submit">
            Send reset link
          </Button>
        </form>
      )}
      <p className="mt-7 text-center text-sm text-muted">
        Remembered your password?{' '}
        <a className="font-medium text-primary hover:underline" href="/login">
          Log in
        </a>
      </p>
    </PublicAuthLayout>
  );
}

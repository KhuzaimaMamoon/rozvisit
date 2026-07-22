import { useState } from 'react';
import { api } from '../../api.js';
import Button from '../../design-system/Button.jsx';
import FormInput from '../../design-system/FormInput.jsx';
import { FormValidationBanner, useFormValidation } from '../../design-system/FormValidation.jsx';
import PublicAuthLayout from './PublicAuthLayout.jsx';

export default function VerifyPrompt() {
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
      await api('/auth/resend-verification', {
        body: JSON.stringify({ email }),
        method: 'POST',
        retry: false,
      });
      setSent(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicAuthLayout subtitle="Confirm your email before signing in." title="Check your inbox">
      <p className="mt-7 text-sm leading-6 text-muted">
        We sent a verification link when you created your account. Please check your inbox and spam
        or junk folder. Enter your email to request another link.
      </p>
      {sent ? (
        <p
          className="mt-5 border-l-[3px] border-success bg-success-soft px-4 py-3 text-sm text-success"
          role="status"
        >
          If an account needs verification, we have sent an email. Please also check your spam or
          junk folder.
        </p>
      ) : null}
      <form {...formProps} className="mt-5 space-y-5" onSubmit={submit}>
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
          Resend verification link
        </Button>
      </form>
      <p className="mt-7 text-center text-sm text-muted">
        <a className="font-medium text-primary hover:underline" href="/login">
          I&apos;ve verified — log in
        </a>
      </p>
    </PublicAuthLayout>
  );
}

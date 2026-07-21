import { useState } from 'react';
import Button from '../../design-system/Button.jsx';
import FormInput from '../../design-system/FormInput.jsx';
import { FormValidationBanner, useFormValidation } from '../../design-system/FormValidation.jsx';
import { roleHome, useAuth } from '../../context/AuthContext.jsx';
import { navigate } from '../../navigation.js';
import PublicAuthLayout from './PublicAuthLayout.jsx';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { clearValidationNotice, formProps, validationMessage } = useFormValidation();

  async function submit(event) {
    event.preventDefault();
    clearValidationNotice();
    setError('');
    setLoading(true);
    try {
      const user = await login({ email, password });
      window.setTimeout(() => navigate(roleHome(user)), 0);
    } catch (requestError) {
      setError(requestError.message);
      setLoading(false);
    }
  }

  return (
    <PublicAuthLayout subtitle="Sign in to continue to your care portal." title="Welcome back">
      {error ? (
        <p
          className="mt-6 border-l-[3px] border-emergency bg-emergency-soft px-4 py-3 text-sm leading-5 text-emergency"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <form {...formProps} className="mt-7 space-y-5" onSubmit={submit}>
        <FormValidationBanner message={validationMessage} />
        <FormInput
          autoComplete="email"
          id="email"
          label="Email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
        <FormInput
          autoComplete="current-password"
          id="password"
          label="Password"
          onChange={(event) => setPassword(event.target.value)}
          required
          trailingAction={
            <button
              aria-label={passwordVisible ? 'Hide password' : 'Show password'}
              className="rounded-sm p-1 text-primary hover:bg-primary-soft focus:outline-none focus:ring-2 focus:ring-primary/25"
              onClick={() => setPasswordVisible((visible) => !visible)}
              type="button"
            >
              <svg aria-hidden="true" fill="none" height="18" viewBox="0 0 24 24" width="18">
                {passwordVisible ? (
                  <path
                    d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10.7 10.7 0 0 1 12 4.9c5.4 0 9 5.1 9 7.1a8.7 8.7 0 0 1-3.2 4.5M6.6 6.6C4.4 8.1 3 10.4 3 12c0 2 3.6 7.1 9 7.1 1.1 0 2.1-.2 3-.6"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                  />
                ) : (
                  <path
                    d="M3 12s3.6-7.1 9-7.1S21 12 21 12s-3.6 7.1-9 7.1S3 12 3 12Zm11.7 0a2.7 2.7 0 1 1-5.4 0 2.7 2.7 0 0 1 5.4 0Z"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                  />
                )}
              </svg>
            </button>
          }
          type={passwordVisible ? 'text' : 'password'}
          value={password}
        />
        <div className="flex justify-end pt-1">
          <a className="text-sm font-medium text-primary hover:underline" href="/forgot">
            Forgot password?
          </a>
        </div>
        <Button className="w-full" loading={loading} type="submit">
          Log in
        </Button>
      </form>
      <p className="mt-7 text-center text-sm text-muted">
        Don&apos;t have an account?{' '}
        <a className="font-medium text-primary hover:underline" href="/register">
          Register
        </a>
      </p>
    </PublicAuthLayout>
  );
}

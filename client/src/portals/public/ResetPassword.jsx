import { useMemo, useState } from 'react';
import { api } from '../../api.js';
import Button from '../../design-system/Button.jsx';
import FormInput from '../../design-system/FormInput.jsx';
import { navigate } from '../../navigation.js';
import PublicAuthLayout from './PublicAuthLayout.jsx';

function passwordError(value) {
  return value.length >= 8 && value.length <= 128 && /[A-Za-z]/.test(value) && /\d/.test(value)
    ? ''
    : 'Use 8–128 characters with at least one letter and one number.';
}

function EyeButton({ visible, onClick }) {
  return (
    <button
      aria-label={visible ? 'Hide password' : 'Show password'}
      className="rounded-sm p-1 text-primary hover:bg-primary-soft"
      onClick={onClick}
      type="button"
    >
      {visible ? 'Hide' : 'Show'}
    </button>
  );
}

export default function ResetPassword() {
  const token = useMemo(() => new URLSearchParams(window.location.search).get('token') ?? '', []);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [visible, setVisible] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const validationError = passwordError(newPassword);
    if (validationError) return setError(validationError);
    if (newPassword !== confirmPassword) return setError('The passwords do not match.');
    if (!token) return setError('This reset link is not valid. Please request a new one.');
    setError('');
    setLoading(true);
    try {
      await api('/auth/reset', {
        body: JSON.stringify({ newPassword, token }),
        method: 'POST',
        retry: false,
      });
      setSuccess(true);
    } catch (requestError) {
      setError(
        requestError.status === 410
          ? 'This reset link has expired, was already used, or is not valid. Please request a new reset link.'
          : requestError.message,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicAuthLayout
      subtitle="Choose a new password for your RozVisit account."
      title="Set a new password"
    >
      {success ? (
        <div className="mt-7 space-y-5">
          <p
            className="border-l-[3px] border-success bg-success-soft px-4 py-3 text-sm leading-6 text-success"
            role="status"
          >
            Your password has been reset. You can now log in.
          </p>
          <Button className="w-full" onClick={() => navigate('/login')}>
            Continue to login
          </Button>
        </div>
      ) : (
        <form className="mt-7 space-y-5" onSubmit={submit}>
          {error ? (
            <p
              className="border-l-[3px] border-emergency bg-emergency-soft px-4 py-3 text-sm leading-6 text-emergency"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          <FormInput
            autoComplete="new-password"
            helperText="At least 8 characters, with letters and numbers."
            id="new-password"
            label="New password"
            onChange={(event) => setNewPassword(event.target.value)}
            required
            trailingAction={
              <EyeButton onClick={() => setVisible((current) => !current)} visible={visible} />
            }
            type={visible ? 'text' : 'password'}
            value={newPassword}
          />
          <FormInput
            autoComplete="new-password"
            id="confirm-password"
            label="Confirm new password"
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            trailingAction={
              <EyeButton onClick={() => setVisible((current) => !current)} visible={visible} />
            }
            type={visible ? 'text' : 'password'}
            value={confirmPassword}
          />
          <Button className="w-full" loading={loading} type="submit">
            Reset password
          </Button>
        </form>
      )}
      {!success ? (
        <p className="mt-7 text-center text-sm text-muted">
          Need another link?{' '}
          <a className="font-medium text-primary hover:underline" href="/forgot">
            Request a reset
          </a>
        </p>
      ) : null}
    </PublicAuthLayout>
  );
}

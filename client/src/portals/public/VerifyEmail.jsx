import { useMemo, useState } from 'react';
import { api } from '../../api.js';
import Button from '../../design-system/Button.jsx';
import { navigate } from '../../navigation.js';
import PublicAuthLayout from './PublicAuthLayout.jsx';

export default function VerifyEmail() {
  const token = useMemo(() => new URLSearchParams(window.location.search).get('token') ?? '', []);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  async function verify() {
    if (!token) return setError('This verification link is not valid. Please request a new one.');
    setError('');
    setLoading(true);
    try {
      await api('/auth/verify-email', {
        body: JSON.stringify({ token }),
        method: 'POST',
        retry: false,
      });
      setVerified(true);
    } catch (requestError) {
      setError(
        requestError.status === 410
          ? 'This verification link has expired, was already used, or is not valid. Please request a new link.'
          : requestError.message,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicAuthLayout subtitle="One final step before you can sign in." title="Verify your email">
      {verified ? (
        <div className="mt-7 space-y-5">
          <p
            className="border-l-[3px] border-success bg-success-soft px-4 py-3 text-sm text-success"
            role="status"
          >
            Your email is verified. You can now sign in.
          </p>
          <Button className="w-full" onClick={() => navigate('/login')}>
            Continue to login
          </Button>
        </div>
      ) : (
        <div className="mt-7 space-y-5">
          {error ? (
            <p
              className="border-l-[3px] border-emergency bg-emergency-soft px-4 py-3 text-sm leading-6 text-emergency"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          <Button className="w-full" loading={loading} onClick={() => void verify()}>
            Verify email
          </Button>
          <a
            className="block text-center text-sm font-medium text-primary hover:underline"
            href="/verify-email"
          >
            Request a new verification link
          </a>
        </div>
      )}
    </PublicAuthLayout>
  );
}

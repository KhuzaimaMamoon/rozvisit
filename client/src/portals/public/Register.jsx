import { useState } from 'react';
import { api } from '../../api.js';
import Button from '../../design-system/Button.jsx';
import FormInput from '../../design-system/FormInput.jsx';
import PublicAuthLayout from './PublicAuthLayout.jsx';

const initialForm = Object.freeze({
  countryCode: '',
  email: '',
  name: '',
  password: '',
  phone: '',
});

export default function Register() {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [fields, setFields] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function update(key) {
    return (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setFields({});
    setLoading(true);
    try {
      await api('/auth/register', { body: JSON.stringify(form), method: 'POST', retry: false });
      setSubmitted(true);
    } catch (requestError) {
      setError(requestError.message);
      setFields(requestError.fields ?? {});
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicAuthLayout subtitle="It takes about a minute." title="Create your account">
      {submitted ? (
        <div
          className="mt-6 border-l-[3px] border-success bg-success-soft px-4 py-3 text-sm text-success"
          role="status"
        >
          Check your email to verify your account, then return here to sign in.
          <a className="mt-2 block font-medium underline" href="/verify-email">
            Request another verification link
          </a>
        </div>
      ) : (
        <form className="mt-7 space-y-5" onSubmit={submit}>
          {error && Object.keys(fields).length === 0 ? (
            <p
              className="border-l-[3px] border-emergency bg-emergency-soft px-4 py-3 text-sm text-emergency"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          <FormInput
            error={fields.name?.[0]}
            id="name"
            label="Full name"
            onChange={update('name')}
            required
            value={form.name}
          />
          <FormInput
            autoComplete="email"
            error={fields.email?.[0]}
            id="email"
            label="Email"
            onChange={update('email')}
            required
            type="email"
            value={form.email}
          />
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_112px]">
            <FormInput
              error={fields.phone?.[0]}
              helperText="Include your country code, for example +971501234567."
              id="phone"
              label="Phone"
              onChange={update('phone')}
              required
              type="tel"
              value={form.phone}
            />
            <FormInput
              error={fields.countryCode?.[0]}
              helperText="For example AE."
              id="countryCode"
              label="Country"
              maxLength="2"
              onChange={update('countryCode')}
              required
              value={form.countryCode}
            />
          </div>
          <FormInput
            autoComplete="new-password"
            error={fields.password?.[0]}
            helperText="At least 8 characters, with letters and numbers."
            id="password"
            label="Password"
            onChange={update('password')}
            required
            type="password"
            value={form.password}
          />
          <Button className="w-full" loading={loading} type="submit">
            Create account
          </Button>
        </form>
      )}
      <p className="mt-7 text-center text-sm text-muted">
        Already have an account?{' '}
        <a className="font-medium text-primary hover:underline" href="/login">
          Log in
        </a>
      </p>
      <p className="mt-3 text-center text-sm text-muted">
        Applying as a caregiver?{' '}
        <a className="font-medium text-primary hover:underline" href="/apply">
          Start your application
        </a>
      </p>
    </PublicAuthLayout>
  );
}

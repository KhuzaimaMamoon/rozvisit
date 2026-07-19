import { useState } from 'react';
import { api } from '../../api.js';
import Button from '../../design-system/Button.jsx';
import FormInput from '../../design-system/FormInput.jsx';

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
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto grid max-w-4xl items-center gap-10 lg:grid-cols-[minmax(0,480px)_1fr]">
        <section className="rounded-lg border border-border bg-surface p-6 shadow-sm sm:p-8">
          <p className="text-lg font-semibold text-primary">RozVisit</p>
          <h1 className="mt-7 text-3xl font-semibold tracking-tight text-text">
            Create your account
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">It takes about a minute.</p>
          {submitted ? (
            <div
              className="mt-6 border-l-[3px] border-success bg-success-soft px-4 py-3 text-sm text-success"
              role="status"
            >
              Check your email to verify your account, then return here to sign in.
            </div>
          ) : (
            <form className="mt-6 space-y-5" onSubmit={submit}>
              {error ? (
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
                helperText="Use a two-letter code, for example AE."
                id="countryCode"
                label="Country"
                maxLength="2"
                onChange={update('countryCode')}
                required
                value={form.countryCode}
              />
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
          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{' '}
            <a className="font-medium text-primary hover:underline" href="/login">
              Log in
            </a>
          </p>
        </section>
        <aside className="hidden space-y-5 text-sm leading-6 text-muted lg:block">
          <p className="font-semibold text-primary">Care that stays clear and accountable.</p>
          <p>Start by creating your client account. You can then add the people you care for.</p>
          <p>Caregiver applications use a separate reviewed path.</p>
        </aside>
      </div>
    </main>
  );
}

import { useState } from 'react';
import { api } from '../../api.js';
import Button from '../../design-system/Button.jsx';
import FormInput from '../../design-system/FormInput.jsx';
import { FormValidationBanner, useFormValidation } from '../../design-system/FormValidation.jsx';
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
  const { clearValidationNotice, formProps, revealFirstInvalid, validationMessage } =
    useFormValidation();

  function update(key) {
    return (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    clearValidationNotice();
    setError('');
    setFields({});
    setLoading(true);
    try {
      await api('/auth/register', { body: JSON.stringify(form), method: 'POST', retry: false });
      setSubmitted(true);
    } catch (requestError) {
      setError(requestError.message);
      setFields(requestError.fields ?? {});
      if (Object.keys(requestError.fields ?? {}).length) revealFirstInvalid();
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicAuthLayout scrollable subtitle="It takes about a minute." title="Create your account">
      {submitted ? (
        <div
          className="mt-6 border-l-[3px] border-success bg-success-soft px-4 py-3 text-sm text-success"
          role="status"
        >
          Check your email to verify your account (please also check your spam or junk folder), then
          return here to sign in.
          <a className="mt-2 block font-medium underline" href="/verify-email">
            Request another verification link
          </a>
        </div>
      ) : (
        <form {...formProps} className="mt-7 space-y-5" onSubmit={submit}>
          <FormValidationBanner message={validationMessage} />
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
            requiredMessage="Enter your full name."
            onChange={update('name')}
            required
            value={form.name}
          />
          <FormInput
            autoComplete="email"
            error={fields.email?.[0]}
            id="email"
            label="Email"
            requiredMessage="Enter a valid email, like name@example.com."
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
              pattern="\+[1-9]\d{1,14}"
              formatMessage="Phone must include a country code, like +971501234567."
              onChange={update('phone')}
              required
              requiredMessage="Phone number must include a country code, like +971501234567."
              type="tel"
              value={form.phone}
            />
            <FormInput
              error={fields.countryCode?.[0]}
              helperText="For example AE."
              id="countryCode"
              label="Country"
              maxLength="2"
              minLength="2"
              pattern="[A-Za-z]{2}"
              formatMessage="Country must be a two-letter code, like AE or PK."
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
            minLength="8"
            maxLength="128"
            pattern="(?=.*[A-Za-z])(?=.*\d).{8,128}"
            formatMessage="Password must be 8–128 characters with at least one letter and one number."
            onChange={update('password')}
            required
            requiredMessage="Password must be at least 8 characters with letters and numbers."
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

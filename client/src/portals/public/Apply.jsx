import { useState } from 'react';
import { api } from '../../api.js';
import Button from '../../design-system/Button.jsx';
import FormInput from '../../design-system/FormInput.jsx';
import PublicAuthLayout from './PublicAuthLayout.jsx';

const initial = {
  cnicNumber: '',
  email: '',
  lat: '',
  lng: '',
  name: '',
  password: '',
  phone: '',
  radiusKm: '10',
};

export default function Apply() {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));
  async function submit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api('/auth/apply', {
        body: JSON.stringify({
          ...form,
          serviceArea: {
            lat: Number(form.lat),
            lng: Number(form.lng),
            radiusKm: Number(form.radiusKm),
          },
        }),
        method: 'POST',
        retry: false,
      });
      setSubmitted(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <PublicAuthLayout
      subtitle="Apply to provide verified local care."
      title="Caregiver application"
    >
      {submitted ? (
        <div
          className="mt-7 border-l-[3px] border-success bg-success-soft px-4 py-3 text-sm leading-6 text-success"
          role="status"
        >
          Your application has been received. Please verify your email, then sign in to see its
          status.
          <a className="mt-2 block font-medium underline" href="/verify-email">
            Request another verification link
          </a>
        </div>
      ) : (
        <form className="mt-7 space-y-5" onSubmit={submit}>
          {error ? (
            <p
              className="border-l-[3px] border-emergency bg-emergency-soft px-4 py-3 text-sm text-emergency"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          <FormInput
            id="name"
            label="Full name"
            onChange={update('name')}
            required
            value={form.name}
          />
          <FormInput
            id="email"
            label="Email"
            onChange={update('email')}
            required
            type="email"
            value={form.email}
          />
          <FormInput
            helperText="Include your country code, for example +923001234567."
            id="phone"
            label="Phone"
            onChange={update('phone')}
            required
            type="tel"
            value={form.phone}
          />
          <FormInput
            helperText="13 digits, without dashes."
            id="cnic"
            label="CNIC number"
            onChange={update('cnicNumber')}
            required
            value={form.cnicNumber}
          />
          <FormInput
            helperText="At least 8 characters, with letters and numbers."
            id="password"
            label="Password"
            onChange={update('password')}
            required
            type="password"
            value={form.password}
          />
          <div className="grid gap-5 sm:grid-cols-3">
            <FormInput
              id="lat"
              label="Service latitude"
              onChange={update('lat')}
              required
              type="number"
              value={form.lat}
            />
            <FormInput
              id="lng"
              label="Service longitude"
              onChange={update('lng')}
              required
              type="number"
              value={form.lng}
            />
            <FormInput
              id="radius"
              label="Radius (km)"
              min="1"
              onChange={update('radiusKm')}
              required
              type="number"
              value={form.radiusKm}
            />
          </div>
          <Button className="w-full" loading={loading} type="submit">
            Submit application
          </Button>
        </form>
      )}
      <p className="mt-7 text-center text-sm text-muted">
        Already have an account?{' '}
        <a className="font-medium text-primary hover:underline" href="/login">
          Log in
        </a>
      </p>
    </PublicAuthLayout>
  );
}

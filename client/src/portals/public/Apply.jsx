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
  const [fields, setFields] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));
  async function submit(event) {
    event.preventDefault();
    setError('');
    setFields({});
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
      setFields(requestError.fields ?? {});
    } finally {
      setLoading(false);
    }
  }
  return (
    <PublicAuthLayout
      subtitle="Apply to provide verified local care."
      title="Caregiver application"
      wide
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
        <form className="mt-6 grid gap-4 lg:grid-cols-2" onSubmit={submit}>
          {error && Object.keys(fields).length === 0 ? (
            <p
              className="border-l-[3px] border-emergency bg-emergency-soft px-4 py-3 text-sm text-emergency lg:col-span-2"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          <FormInput
            error={fields.email?.[0]}
            id="name"
            label="Full name"
            onChange={update('name')}
            required
            value={form.name}
          />
          <FormInput
            error={fields.phone?.[0]}
            id="email"
            label="Email"
            onChange={update('email')}
            required
            requiredMessage="Phone number must include a country code, like +923001234567."
            type="email"
            value={form.email}
          />
          <FormInput
            error={fields.cnicNumber?.[0]}
            helperText="Include your country code, for example +923001234567."
            id="phone"
            label="Phone"
            onChange={update('phone')}
            required
            requiredMessage="CNIC must be exactly 13 digits."
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
          <div className="lg:col-span-2">
            <FormInput
              error={fields.password?.[0]}
              helperText="At least 8 characters, with letters and numbers."
              id="password"
              label="Password"
              onChange={update('password')}
              required
              requiredMessage="Password must be at least 8 characters with letters and numbers."
              type="password"
              value={form.password}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:col-span-2">
            <FormInput
              error={fields.serviceArea?.[0]}
              id="lat"
              label="Service latitude"
              onChange={update('lat')}
              required
              type="number"
              value={form.lat}
            />
            <FormInput
              error={fields.serviceArea?.[0]}
              id="lng"
              label="Service longitude"
              onChange={update('lng')}
              required
              type="number"
              value={form.lng}
            />
            <FormInput
              error={fields.serviceArea?.[0]}
              id="radius"
              label="Radius (km)"
              min="1"
              onChange={update('radiusKm')}
              required
              type="number"
              value={form.radiusKm}
            />
          </div>
          <Button className="w-full lg:col-span-2" loading={loading} type="submit">
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

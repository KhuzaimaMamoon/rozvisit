import { useState } from 'react';
import { api } from '../../api.js';
import Button from '../../design-system/Button.jsx';
import FormInput from '../../design-system/FormInput.jsx';
import { FormValidationBanner, useFormValidation } from '../../design-system/FormValidation.jsx';
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
  const { clearValidationNotice, formProps, revealFirstInvalid, validationMessage } =
    useFormValidation();
  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));
  async function submit(event) {
    event.preventDefault();
    clearValidationNotice();
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
      if (Object.keys(requestError.fields ?? {}).length) revealFirstInvalid();
    } finally {
      setLoading(false);
    }
  }
  return (
    <PublicAuthLayout
      scrollable
      subtitle="Apply to provide verified local care."
      title="Caregiver application"
      wide
    >
      {submitted ? (
        <div
          className="mt-7 border-l-[3px] border-success bg-success-soft px-4 py-3 text-sm leading-6 text-success"
          role="status"
        >
          Your application has been received. Please verify your email (and check your spam or junk
          folder), then sign in to see its status.
          <a className="mt-2 block font-medium underline" href="/verify-email">
            Request another verification link
          </a>
        </div>
      ) : (
        <form {...formProps} className="mt-6 grid gap-4 lg:grid-cols-2" onSubmit={submit}>
          <div className="lg:col-span-2">
            <FormValidationBanner message={validationMessage} />
          </div>
          {error && Object.keys(fields).length === 0 ? (
            <p
              className="border-l-[3px] border-emergency bg-emergency-soft px-4 py-3 text-sm text-emergency lg:col-span-2"
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
            error={fields.email?.[0]}
            id="email"
            label="Email"
            onChange={update('email')}
            required
            requiredMessage="Enter a valid email, like name@example.com."
            type="email"
            value={form.email}
          />
          <FormInput
            error={fields.phone?.[0]}
            helperText="Include your country code, for example +923001234567."
            id="phone"
            label="Phone"
            pattern="\+[1-9]\d{1,14}"
            formatMessage="Phone must include a country code, like +923001234567."
            onChange={update('phone')}
            required
            requiredMessage="Phone number must include a country code, like +923001234567."
            type="tel"
            value={form.phone}
          />
          <FormInput
            error={fields.cnicNumber?.[0]}
            helperText="13 digits, without dashes."
            id="cnic"
            label="CNIC number"
            pattern="\d{13}"
            formatMessage="CNIC must be exactly 13 digits, no dashes."
            onChange={update('cnicNumber')}
            required
            requiredMessage="CNIC must be exactly 13 digits."
            value={form.cnicNumber}
          />
          <div className="lg:col-span-2">
            <FormInput
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
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:col-span-2">
            <FormInput
              error={fields.serviceArea?.[0]}
              id="lat"
              label="Service latitude"
              min="-90"
              max="90"
              step="any"
              formatMessage="Latitude must be a number between -90 and 90."
              onChange={update('lat')}
              required
              type="number"
              value={form.lat}
            />
            <FormInput
              error={fields.serviceArea?.[0]}
              id="lng"
              label="Service longitude"
              min="-180"
              max="180"
              step="any"
              formatMessage="Longitude must be a number between -180 and 180."
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
              step="any"
              formatMessage="Service radius must be at least 1 kilometre."
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

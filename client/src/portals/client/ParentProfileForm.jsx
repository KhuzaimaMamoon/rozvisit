import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api.js';
import Button from '../../design-system/Button.jsx';
import Card from '../../design-system/Card.jsx';
import FormInput from '../../design-system/FormInput.jsx';
import FormTextarea from '../../design-system/FormTextarea.jsx';
import { FormValidationBanner, useFormValidation } from '../../design-system/FormValidation.jsx';
import { navigate } from '../../navigation.js';

const DRAFT_KEY = 'rozvisit.parent-profile.draft';
const initialContact = { name: '', phone: '', relation: '', priority: 1 };
const initialForm = {
  name: '',
  age: '',
  phone: '',
  addressText: '',
  locationShareUrl: '',
  careNotes: '',
  emergencyContacts: [initialContact],
};

function loadDraft() {
  try {
    return JSON.parse(window.localStorage.getItem(DRAFT_KEY)) ?? initialForm;
  } catch {
    return initialForm;
  }
}

export default function ParentProfileForm() {
  const editId = useMemo(
    () => window.location.pathname.match(/^\/app\/parents\/([^/]+)\/edit$/)?.[1],
    [],
  );
  const [form, setForm] = useState(editId ? initialForm : loadDraft);
  const [loading, setLoading] = useState(Boolean(editId));
  const [error, setError] = useState('');
  const [fields, setFields] = useState({});
  const [saving, setSaving] = useState(false);
  const { clearValidationNotice, formProps, revealFirstInvalid, validationMessage } =
    useFormValidation();

  useEffect(() => {
    if (!editId) window.localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  }, [editId, form]);

  useEffect(() => {
    if (!editId) return;
    api(`/parents/${editId}`)
      .then((parent) => {
        setForm({
          name: parent.name,
          age: String(parent.age),
          phone: parent.phone ?? '',
          addressText: parent.addressText,
          locationShareUrl: parent.locationShareUrl ?? '',
          careNotes: parent.careNotes ?? '',
          emergencyContacts: parent.emergencyContacts?.length
            ? parent.emergencyContacts.map((contact) => ({ ...contact }))
            : [{ ...initialContact }],
        });
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [editId]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateContact(index, field, value) {
    setForm((current) => ({
      ...current,
      emergencyContacts: current.emergencyContacts.map((contact, contactIndex) =>
        contactIndex === index ? { ...contact, [field]: value } : contact,
      ),
    }));
  }

  function addContact() {
    setForm((current) => ({
      ...current,
      emergencyContacts: [
        ...current.emergencyContacts,
        { ...initialContact, priority: current.emergencyContacts.length + 1 },
      ],
    }));
  }

  function removeContact(index) {
    if (form.emergencyContacts.length === 1) return;
    setForm((current) => ({
      ...current,
      emergencyContacts: current.emergencyContacts.filter(
        (_, contactIndex) => contactIndex !== index,
      ),
    }));
  }

  async function saveParent(event) {
    event.preventDefault();
    if (saving) return;

    clearValidationNotice();
    setError('');
    setFields({});
    if (!editId) window.localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    setSaving(true);
    try {
      const parent = await api(editId ? `/parents/${editId}` : '/parents', {
        body: JSON.stringify({
          name: form.name,
          age: Number(form.age),
          phone: form.phone,
          addressText: form.addressText,
          locationShareUrl: form.locationShareUrl,
          careNotes: form.careNotes,
          emergencyContacts: form.emergencyContacts.map((contact) => ({
            ...contact,
            priority: Number(contact.priority),
          })),
        }),
        method: editId ? 'PATCH' : 'POST',
      });
      if (!editId) window.localStorage.removeItem(DRAFT_KEY);
      navigate(`/app/parents/${parent.id}`);
    } catch (requestError) {
      setError(requestError.message);
      setFields(requestError.fields ?? {});
      if (Object.keys(requestError.fields ?? {}).length) revealFirstInvalid();
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <main className="min-h-screen bg-background p-6 text-sm text-muted">Loading parent…</main>
    );

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-lg border border-border bg-primary-soft p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-primary">
                Parent profile
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
                {editId ? 'Update parent details' : 'Add your parent'}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Share the details that help us provide respectful, familiar support.
              </p>
            </div>
            <p className="w-full rounded-full border border-border bg-primary-soft px-3 py-2 text-center text-xs font-medium text-primary sm:w-auto">
              {editId ? 'Changes save securely' : 'Drafts are saved on this device'}
            </p>
          </div>
        </header>

        <form {...formProps} className="mt-6 space-y-6" onSubmit={saveParent}>
          <FormValidationBanner message={validationMessage} />
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
            <Card className="p-5 sm:p-6" title="Parent details">
              <p className="mt-2 text-sm leading-6 text-muted">
                Start with the information that helps us recognise and support your parent.
              </p>
              <div className="mt-6 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormInput
                    error={fields.name?.[0]}
                    id="parent-name"
                    label="Name"
                    requiredMessage="Enter your parent’s full name."
                    value={form.name}
                    onChange={(event) => update('name', event.target.value)}
                    required
                  />
                  <FormInput
                    error={fields.age?.[0]}
                    id="parent-age"
                    label="Age"
                    formatMessage="Age must be a whole number between 40 and 120."
                    min="40"
                    max="120"
                    type="number"
                    value={form.age}
                    onChange={(event) => update('age', event.target.value)}
                    required
                  />
                </div>
                <FormInput
                  error={fields.phone?.[0]}
                  id="parent-phone"
                  label="Phone"
                  optional
                  pattern="\+[1-9]\d{1,14}"
                  formatMessage="Phone must include a country code, like +923001234567."
                  value={form.phone}
                  onChange={(event) => update('phone', event.target.value)}
                />
                <FormInput
                  error={fields.addressText?.[0]}
                  id="parent-address"
                  label="Address"
                  requiredMessage="Enter the full home address caregivers should use."
                  value={form.addressText}
                  onChange={(event) => update('addressText', event.target.value)}
                  required
                />
              </div>
              <div className="mt-6 border-t border-border pt-6">
                <h2 className="text-base font-semibold text-text">Pinned home location</h2>
                <div className="mt-4">
                  <FormInput
                    error={fields.locationShareUrl?.[0]}
                    formatMessage="Paste a Google Maps share link from maps.google.com or maps.app.goo.gl."
                    helperText="Open Google Maps, find the exact home pin, tap Share, then copy and paste the link here."
                    id="parent-location-link"
                    label="Google Maps share link"
                    requiredMessage="Paste the Google Maps share link for your parent’s home."
                    type="url"
                    value={form.locationShareUrl}
                    onChange={(event) => update('locationShareUrl', event.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="mt-6 border-t border-border pt-6">
                <FormTextarea
                  id="parent-notes"
                  error={fields.careNotes?.[0]}
                  label="Care notes"
                  optional
                  helperText="Sensitive: only share details needed to support your parent."
                  value={form.careNotes}
                  onChange={(event) => update('careNotes', event.target.value)}
                />
              </div>
            </Card>

            <aside className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
              <div className="border-b border-border bg-primary-soft p-5">
                <p className="text-sm font-semibold text-primary">Map pin</p>
                <p className="mt-2 text-sm leading-6 text-text">
                  Share the exact home pin without typing technical coordinates.
                </p>
              </div>
              <div className="p-5">
                <div>
                  <p className="text-sm font-semibold text-text">How to copy the pin</p>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    Open Google Maps, search for the home, adjust the pin if needed, then tap Share
                    and Copy link.
                  </p>
                </div>
                <div className="mt-5 border-t border-border pt-5">
                  <p className="text-sm font-semibold text-text">What RozVisit stores</p>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    The original link is protected, while its coordinates support service-area
                    matching.
                  </p>
                </div>
                <div className="-mx-5 -mb-5 mt-5 border-t border-border bg-primary-soft px-5 py-5">
                  <p className="text-sm font-semibold text-text">Care context</p>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    Assigned caregivers receive a Get directions action that opens navigation to
                    this pin.
                  </p>
                </div>
              </div>
            </aside>
          </section>

          <Card className="p-5 sm:p-6" title="Emergency contacts">
            <p className="mt-2 text-sm leading-6 text-muted">
              Add at least one person. Priority 1 is contacted first.
            </p>
            <div className="mt-6 space-y-4">
              {form.emergencyContacts.map((contact, index) => (
                <section
                  aria-label={`Emergency contact ${index + 1}`}
                  className="rounded-lg border border-border bg-surface-sunken p-4 sm:p-5"
                  key={`${contact.priority}-${index}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-sm font-semibold text-text">
                      Emergency contact {index + 1}
                    </h2>
                    {form.emergencyContacts.length > 1 ? (
                      <Button
                        aria-label={`Remove emergency contact ${index + 1}`}
                        className="h-8 min-h-0 w-8 px-0 text-lg leading-none"
                        onClick={() => removeContact(index)}
                        type="button"
                        variant="ghost"
                      >
                        ×
                      </Button>
                    ) : null}
                  </div>
                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <FormInput
                      error={index === 0 ? fields.emergencyContacts?.[0] : undefined}
                      id={`contact-name-${index}`}
                      label="Name"
                      requiredMessage="Enter the emergency contact’s full name."
                      value={contact.name}
                      onChange={(event) => updateContact(index, 'name', event.target.value)}
                      required
                    />
                    <FormInput
                      id={`contact-relation-${index}`}
                      label="Relationship"
                      requiredMessage="Enter their relationship, like Daughter or Neighbour."
                      value={contact.relation}
                      onChange={(event) => updateContact(index, 'relation', event.target.value)}
                      required
                    />
                    <FormInput
                      id={`contact-phone-${index}`}
                      label="Phone"
                      pattern="\+[1-9]\d{1,14}"
                      formatMessage="Phone must include a country code, like +923001234567."
                      value={contact.phone}
                      onChange={(event) => updateContact(index, 'phone', event.target.value)}
                      required
                    />
                    <FormInput
                      id={`contact-priority-${index}`}
                      label="Priority"
                      formatMessage="Priority must be a positive whole number; 1 is contacted first."
                      min="1"
                      type="number"
                      value={contact.priority}
                      onChange={(event) => updateContact(index, 'priority', event.target.value)}
                      required
                    />
                  </div>
                </section>
              ))}
            </div>
            <Button
              className="mt-5 w-full sm:w-auto"
              onClick={addContact}
              type="button"
              variant="secondary"
            >
              Add another contact
            </Button>
          </Card>

          <section className="rounded-lg border border-border bg-primary-soft p-5 shadow-sm sm:p-6">
            <p className="text-sm font-semibold text-primary">Consent happens at the first visit</p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Your parent will be asked clearly about visits, photos, and their preferences by their
              assigned caregiver. Nothing is treated as consent until that conversation happens.
            </p>
          </section>
          {error && Object.keys(fields).length === 0 ? (
            <p
              aria-live="polite"
              className="rounded-r-md border-l-[3px] border-emergency bg-emergency-soft p-4 text-sm leading-6 text-emergency"
            >
              {error}
            </p>
          ) : null}
          <div className="flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">You can continue editing after saving this draft.</p>
            <Button className="w-full sm:w-auto" loading={saving} type="submit">
              {editId ? 'Save changes' : 'Save parent details'}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}

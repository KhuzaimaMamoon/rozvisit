import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import Button from '../../design-system/Button.jsx';
import Card from '../../design-system/Card.jsx';
import FormInput from '../../design-system/FormInput.jsx';
import { navigate } from '../../navigation.js';

const DRAFT_KEY = 'rozvisit.parent-profile.draft';
const initialContact = { name: '', phone: '', relation: '', priority: 1 };
const initialForm = {
  name: '',
  age: '',
  phone: '',
  addressText: '',
  lng: '',
  lat: '',
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
  const [form, setForm] = useState(loadDraft);
  const [error, setError] = useState('');
  const [fields, setFields] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
  }, [form]);

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

    setError('');
    setFields({});
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    setSaving(true);
    try {
      const parent = await api('/parents', {
        body: JSON.stringify({
          name: form.name,
          age: Number(form.age),
          phone: form.phone,
          addressText: form.addressText,
          location: { lng: Number(form.lng), lat: Number(form.lat) },
          careNotes: form.careNotes,
          emergencyContacts: form.emergencyContacts.map((contact) => ({
            ...contact,
            priority: Number(contact.priority),
          })),
        }),
        method: 'POST',
      });
      window.localStorage.removeItem(DRAFT_KEY);
      navigate(`/app/parents/${parent.id}`);
    } catch (requestError) {
      setError(requestError.message);
      setFields(requestError.fields ?? {});
    } finally {
      setSaving(false);
    }
  }

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
                Add your parent
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Share the details that help us provide respectful, familiar support.
              </p>
            </div>
            <p className="w-full rounded-full border border-border bg-primary-soft px-3 py-2 text-center text-xs font-medium text-primary sm:w-auto">
              Drafts are saved on this device
            </p>
          </div>
        </header>

        <form className="mt-6 space-y-6" onSubmit={saveParent}>
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
                    value={form.name}
                    onChange={(event) => update('name', event.target.value)}
                    required
                  />
                  <FormInput
                    error={fields.age?.[0]}
                    id="parent-age"
                    label="Age"
                    min="40"
                    max="120"
                    type="number"
                    value={form.age}
                    onChange={(event) => update('age', event.target.value)}
                    required
                  />
                </div>
                <FormInput
                  id="parent-phone"
                  label="Phone"
                  optional
                  value={form.phone}
                  onChange={(event) => update('phone', event.target.value)}
                />
                <FormInput
                  error={fields.addressText?.[0]}
                  id="parent-address"
                  label="Address"
                  value={form.addressText}
                  onChange={(event) => update('addressText', event.target.value)}
                  required
                />
              </div>
              <div className="mt-6 border-t border-border pt-6">
                <h2 className="text-base font-semibold text-text">Location</h2>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <FormInput
                    error={fields.location?.[0]}
                    id="parent-lng"
                    label="Longitude"
                    value={form.lng}
                    onChange={(event) => update('lng', event.target.value)}
                    required
                  />
                  <FormInput
                    error={fields.location?.[0]}
                    id="parent-lat"
                    label="Latitude"
                    value={form.lat}
                    onChange={(event) => update('lat', event.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="mt-6 border-t border-border pt-6">
                <FormInput
                  id="parent-notes"
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
                  Set the parent&apos;s location with the map pin coordinates.
                </p>
              </div>
              <div className="p-5">
                <div>
                  <p className="text-sm font-semibold text-text">Location coordinates</p>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    Enter the longitude and latitude values shown for the parent&apos;s location.
                  </p>
                </div>
                <div className="mt-5 border-t border-border pt-5">
                  <p className="text-sm font-semibold text-text">Required order</p>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    Coordinates are stored as [longitude, latitude] with the parent profile.
                  </p>
                </div>
                <div className="-mx-5 -mb-5 mt-5 border-t border-border bg-primary-soft px-5 py-5">
                  <p className="text-sm font-semibold text-text">Care context</p>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    The stored location provides context for care assignment.
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
                      id={`contact-name-${index}`}
                      label="Name"
                      value={contact.name}
                      onChange={(event) => updateContact(index, 'name', event.target.value)}
                      required
                    />
                    <FormInput
                      id={`contact-relation-${index}`}
                      label="Relationship"
                      value={contact.relation}
                      onChange={(event) => updateContact(index, 'relation', event.target.value)}
                      required
                    />
                    <FormInput
                      id={`contact-phone-${index}`}
                      label="Phone"
                      value={contact.phone}
                      onChange={(event) => updateContact(index, 'phone', event.target.value)}
                      required
                    />
                    <FormInput
                      id={`contact-priority-${index}`}
                      label="Priority"
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
              Save parent details
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}

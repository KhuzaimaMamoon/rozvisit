import { useEffect, useState } from 'react';
import Button from '../../design-system/Button.jsx';
import Card from '../../design-system/Card.jsx';
import FormInput from '../../design-system/FormInput.jsx';

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
  const [message, setMessage] = useState('');

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

  function saveDraft(event) {
    event.preventDefault();
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    setMessage('Your draft is saved on this device.');
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
      <header className="mb-6 space-y-2">
        <h1 className="text-2xl font-semibold text-text">Add your parent</h1>
        <p className="text-sm text-muted">
          Save the details that help us provide respectful, familiar support.
        </p>
      </header>
      <form className="space-y-5" onSubmit={saveDraft}>
        <Card title="Parent details">
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormInput
              id="parent-name"
              label="Name"
              value={form.name}
              onChange={(event) => update('name', event.target.value)}
            />
            <FormInput
              id="parent-age"
              label="Age"
              min="40"
              max="120"
              type="number"
              value={form.age}
              onChange={(event) => update('age', event.target.value)}
            />
            <FormInput
              id="parent-phone"
              label="Phone"
              optional
              value={form.phone}
              onChange={(event) => update('phone', event.target.value)}
            />
            <FormInput
              id="parent-address"
              label="Address"
              value={form.addressText}
              onChange={(event) => update('addressText', event.target.value)}
            />
          </div>
          <p className="mt-4 text-sm text-muted">
            Place the map pin manually if address search is unavailable. Both coordinates are saved.
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <FormInput
              id="parent-lng"
              label="Longitude"
              value={form.lng}
              onChange={(event) => update('lng', event.target.value)}
            />
            <FormInput
              id="parent-lat"
              label="Latitude"
              value={form.lat}
              onChange={(event) => update('lat', event.target.value)}
            />
          </div>
          <div className="mt-4">
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

        <Card title="Emergency contacts">
          <p className="mt-2 text-sm text-muted">
            Add at least one person. Priority 1 is contacted first.
          </p>
          <div className="mt-4 space-y-5">
            {form.emergencyContacts.map((contact, index) => (
              <fieldset
                className="rounded-sm border border-border p-4"
                key={`${contact.priority}-${index}`}
              >
                <legend className="px-1 text-sm font-medium text-text">Contact {index + 1}</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormInput
                    id={`contact-name-${index}`}
                    label="Name"
                    value={contact.name}
                    onChange={(event) => updateContact(index, 'name', event.target.value)}
                  />
                  <FormInput
                    id={`contact-relation-${index}`}
                    label="Relationship"
                    value={contact.relation}
                    onChange={(event) => updateContact(index, 'relation', event.target.value)}
                  />
                  <FormInput
                    id={`contact-phone-${index}`}
                    label="Phone"
                    value={contact.phone}
                    onChange={(event) => updateContact(index, 'phone', event.target.value)}
                  />
                  <FormInput
                    id={`contact-priority-${index}`}
                    label="Priority"
                    min="1"
                    type="number"
                    value={contact.priority}
                    onChange={(event) => updateContact(index, 'priority', event.target.value)}
                  />
                </div>
                {form.emergencyContacts.length > 1 ? (
                  <Button className="mt-4" onClick={() => removeContact(index)} variant="ghost">
                    Remove contact
                  </Button>
                ) : null}
              </fieldset>
            ))}
          </div>
          <Button className="mt-4" onClick={addContact} variant="secondary">
            Add another contact
          </Button>
        </Card>

        <Card title="Consent happens at the first visit">
          <p className="text-sm text-muted">
            Your parent will be asked clearly about visits, photos, and their preferences by their
            assigned caregiver. Nothing is treated as consent until that conversation happens.
          </p>
        </Card>
        {message ? (
          <p aria-live="polite" className="text-sm text-success">
            {message}
          </p>
        ) : null}
        <Button type="submit">Save parent details</Button>
      </form>
    </main>
  );
}

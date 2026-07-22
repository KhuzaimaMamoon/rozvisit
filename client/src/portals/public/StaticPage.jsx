import BrandMark from '../../design-system/BrandMark.jsx';
import { navigate } from '../../navigation.js';

const pageContent = Object.freeze({
  privacy: {
    eyebrow: 'Privacy',
    title: 'Privacy policy',
    intro:
      'RozVisit is designed to help families coordinate care while protecting the dignity and privacy of every parent.',
    sections: [
      [
        'What we collect',
        'Account details, parent care details, visit records, and the in-app camera proof needed to show what happened during a visit.',
      ],
      [
        'Why we collect it',
        'We use this information to coordinate care, provide honest visit updates, and keep the records needed to answer concerns.',
      ],
      [
        'Consent and access',
        'A parent gives their own consent to visits and photo or video capture. Access is limited to people with a care-related purpose.',
      ],
      [
        'Storage and retention',
        'Customer data is hosted on cloud infrastructure in the Asia-Pacific region. Visit evidence is kept for the life of the account; media is retained for the account period and the stated post-cancellation period.',
      ],
      [
        'Deletion requests',
        'You may request account deletion. Personal information is anonymized while the anonymous evidence needed for records is retained. We aim to respond within 30 days.',
      ],
    ],
  },
  terms: {
    eyebrow: 'Terms',
    title: 'Terms of service',
    intro:
      'These terms explain the shared responsibilities that make RozVisit clear, respectful, and accountable for every family.',
    sections: [
      [
        'Care coordination',
        'RozVisit helps families coordinate visits and view care records. It does not replace emergency services, medical advice, or clinical care.',
      ],
      [
        'Respectful visits',
        'Visits follow the parent’s recorded consent choices, including photo and video boundaries. A parent may withdraw consent at any time.',
      ],
      [
        'Visit records',
        'Caregivers complete the visit checklist and record in-app camera proof when required. Missed or declined visits are shown honestly.',
      ],
      [
        'Accounts and plans',
        'Clients keep their account details accurate. Subscription pricing is confirmed before payment and stays recorded with the subscription.',
      ],
      [
        'Questions or concerns',
        'Contact RozVisit support if you have a question about a visit, your account, or these terms.',
      ],
    ],
  },
});

export default function StaticPage({ kind }) {
  const content = pageContent[kind];
  return (
    <main className="min-h-dvh bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <header className="rounded-lg border border-border bg-primary-soft p-6 shadow-sm">
          <BrandMark />
          <p className="mt-5 text-sm font-medium uppercase tracking-wide text-primary">
            {content.eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text">{content.title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{content.intro}</p>
        </header>
        <section className="mt-6 space-y-4">
          {content.sections.map(([title, detail]) => (
            <article
              className="rounded-lg border border-border bg-surface p-5 shadow-sm"
              key={title}
            >
              <h2 className="text-lg font-semibold text-text">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{detail}</p>
            </article>
          ))}
        </section>
        <button
          className="mt-6 text-sm font-medium text-primary underline"
          onClick={() => (window.history.length > 1 ? window.history.back() : navigate('/login'))}
          type="button"
        >
          Back to previous page
        </button>
      </div>
    </main>
  );
}

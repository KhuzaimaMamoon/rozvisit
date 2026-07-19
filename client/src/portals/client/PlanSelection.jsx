import { useState } from 'react';
import Button from '../../design-system/Button.jsx';

const plans = [
  {
    name: 'Basic',
    visits: '1 visit each week',
    errands: 'No errands included',
    price: 'AED 90–130',
    summary: 'A gentle, dependable rhythm of support.',
  },
  {
    name: 'Standard',
    visits: '3 visits each week',
    errands: '1 errand each week',
    price: 'AED 165–220',
    summary: 'Regular support for the week-to-week essentials.',
  },
  {
    name: 'Premium',
    visits: 'Daily visits',
    errands: 'Unlimited errands',
    price: 'AED 275–350',
    summary: 'The fullest routine of care and practical support.',
  },
];

const paymentSteps = [
  ['1', 'Choose a plan', 'Pick the level of support that suits your family.'],
  ['2', 'Receive your link', 'We send a secure Payoneer payment link within 24 hours.'],
  ['3', 'Start scheduling', 'Once payment is recorded, your subscription becomes active.'],
];

export default function PlanSelection() {
  const [selectedPlan, setSelectedPlan] = useState(null);

  return (
    <main className="min-h-screen bg-background px-4 py-3 sm:px-6 sm:py-4 lg:h-screen lg:overflow-hidden">
      <div className="mx-auto max-w-7xl">
        <header className="flex items-center border-b border-border pb-4">
          <p className="text-lg font-semibold tracking-tight text-primary">RozVisit</p>
        </header>

        <section className="mt-4">
          <p className="text-sm font-medium text-primary">Care for Amina Bibi</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-text">
            Choose a care plan
          </h1>
          <p className="mt-1 text-sm leading-5 text-muted">
            Review the support, pricing, and payment steps in one place.
          </p>
        </section>

        <section
          aria-label="Available care plans"
          className="mt-5 grid items-stretch gap-5 md:grid-cols-3"
        >
          {plans.map((plan) => (
            <article
              aria-label={`${plan.name}, ${plan.price} per month`}
              className="flex min-h-80 flex-col rounded-lg border border-border bg-surface p-5 shadow-sm transition-all duration-150 hover:-translate-y-1 hover:border-primary hover:shadow-md motion-reduce:transform-none"
              key={plan.name}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold text-text">{plan.name}</h2>
                  <span className="rounded-full bg-primary-soft px-2 py-1 text-xs font-medium text-primary">
                    Monthly
                  </span>
                </div>
                <p className="mt-2 min-h-10 text-sm leading-5 text-muted">{plan.summary}</p>
              </div>
              <div className="mt-4 border-y border-border py-3">
                <p className="text-2xl font-bold tabular-nums text-text">{plan.price}</p>
                <p className="mt-1 text-xs text-muted">per month</p>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-text">
                <li className="flex gap-2">
                  <span aria-hidden="true" className="text-primary">
                    •
                  </span>
                  {plan.visits}
                </li>
                <li className="flex gap-2">
                  <span aria-hidden="true" className="text-primary">
                    •
                  </span>
                  {plan.errands}
                </li>
              </ul>
              <Button className="mt-auto w-full" onClick={() => setSelectedPlan(plan.name)}>
                Select {plan.name}
              </Button>
            </article>
          ))}
        </section>

        {selectedPlan ? (
          <section
            aria-live="polite"
            className="fixed inset-x-4 top-4 z-10 max-w-md border-l-[3px] border-primary bg-primary-soft p-4 text-sm text-text shadow-md sm:left-auto sm:w-full"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{selectedPlan} plan selected</p>
                <p className="mt-2 leading-6 text-muted">
                  We will send your secure Payoneer payment link within 24 hours. Your plan will
                  become active once payment has been recorded.
                </p>
              </div>
              <Button
                aria-label="Dismiss plan selection confirmation"
                className="shrink-0"
                onClick={() => setSelectedPlan(null)}
                variant="ghost"
              >
                Dismiss
              </Button>
            </div>
          </section>
        ) : null}

        <section className="mt-5 rounded-lg border border-border bg-primary-soft p-4 shadow-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold text-text">How payment works</h2>
            <p className="text-xs text-muted">Clear steps, with no hidden charges.</p>
          </div>
          <ol className="mt-3 grid gap-3 md:grid-cols-3">
            {paymentSteps.map(([number, title, detail]) => (
              <li className="flex gap-3 rounded-md bg-surface p-3" key={number}>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-text">
                  {number}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-text">{title}</h3>
                  <p className="mt-1 text-xs leading-4 text-muted">{detail}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-3 border-t border-border pt-3 text-xs leading-4 text-muted">
            Introductory pricing is confirmed with you before payment is requested.
          </p>
        </section>
      </div>
    </main>
  );
}

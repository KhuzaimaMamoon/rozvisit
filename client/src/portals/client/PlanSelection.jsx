import { useState } from 'react';
import Button from '../../design-system/Button.jsx';
import Card from '../../design-system/Card.jsx';

const plans = [
  {
    name: 'Basic',
    visits: '1 visit / week',
    errands: 'No errands included',
    price: 'AED 90–130 / month',
  },
  {
    name: 'Standard',
    visits: '3 visits / week',
    errands: '1 errand / week',
    price: 'AED 165–220 / month',
  },
  {
    name: 'Premium',
    visits: 'Daily visits',
    errands: 'Unlimited errands',
    price: 'AED 275–350 / month',
  },
];

export default function PlanSelection() {
  const [compareOpen, setCompareOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold text-primary">RozVisit</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
          Choose Ammi&apos;s care plan
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Pick the level of regular support that feels right. You can see the full plan history at
          any time.
        </p>
      </header>

      <p
        aria-live="polite"
        className="mx-auto mt-6 w-fit rounded-full bg-pending-soft px-3 py-1 text-sm font-medium text-pending"
      >
        Introductory pricing — locked when you subscribe
      </p>

      <section
        aria-label="Available care plans"
        className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {plans.map((plan) => (
          <Card key={plan.name}>
            <div className="flex min-h-72 flex-col">
              <h2 className="text-lg font-semibold text-text">{plan.name}</h2>
              <p className="mt-5 font-medium text-text">{plan.visits}</p>
              <p className="mt-2 text-sm text-muted">{plan.errands}</p>
              <p className="mt-6 text-2xl font-bold tabular-nums text-text">{plan.price}</p>
              <p className="mt-2 text-sm text-muted">
                Shown in your account currency when you select.
              </p>
              <Button className="mt-auto w-full" onClick={() => setSelectedPlan(plan.name)}>
                Select {plan.name}
              </Button>
            </div>
          </Card>
        ))}
      </section>

      {selectedPlan ? (
        <section
          aria-live="polite"
          className="mx-auto mt-5 max-w-2xl rounded-md border border-border bg-surface p-4 text-sm text-text shadow-sm"
        >
          <p className="font-medium">{selectedPlan} selected</p>
          <p className="mt-1 text-muted">
            We will send your secure Payoneer payment link within 24 hours. Your plan activates
            after payment is recorded.
          </p>
        </section>
      ) : null}

      <section
        className="mt-6 rounded-lg bg-primary-soft p-5 sm:p-6"
        aria-label="How payment works"
      >
        <h2 className="text-lg font-semibold text-text">How payment works</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            'Select a plan',
            'We send a secure Payoneer link within 24 hours',
            'Your subscription activates',
          ].map((step, index) => (
            <li className="flex gap-3 text-sm text-text" key={step}>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent font-semibold text-text">
                {index + 1}
              </span>
              <span className="pt-1">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-6 text-center">
        <Button onClick={() => setCompareOpen(true)} variant="ghost">
          Compare plans
        </Button>
      </div>
      {compareOpen ? (
        <section
          aria-label="Plan comparison"
          className="mx-auto mt-4 max-w-3xl rounded-lg border border-border bg-surface p-5 shadow-md"
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-text">Compare plans</h2>
            <Button
              aria-label="Close plan comparison"
              onClick={() => setCompareOpen(false)}
              variant="ghost"
            >
              Close
            </Button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-sunken text-muted">
                <tr>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Visits</th>
                  <th className="p-3">Errands</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr className="border-b border-border last:border-0" key={plan.name}>
                    <td className="p-3 font-medium text-text">{plan.name}</td>
                    <td className="p-3 text-muted">{plan.visits}</td>
                    <td className="p-3 text-muted">{plan.errands}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </main>
  );
}

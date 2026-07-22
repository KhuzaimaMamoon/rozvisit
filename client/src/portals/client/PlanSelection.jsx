import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api.js';
import Button from '../../design-system/Button.jsx';
import { navigate } from '../../navigation.js';

const planDetails = {
  Basic: {
    summary: 'A gentle, dependable rhythm of support.',
  },
  Standard: {
    summary: 'Regular support for the week-to-week essentials.',
  },
  Premium: {
    summary: 'The fullest routine of care and practical support.',
  },
};

const paymentSteps = [
  ['1', 'Choose a plan', 'Pick the level of support that suits your family.'],
  ['2', 'Receive your link', 'We send a secure Payoneer payment link within 24 hours.'],
  ['3', 'Start scheduling', 'Once payment is recorded, your subscription becomes active.'],
];

export default function PlanSelection() {
  const parentId = useMemo(() => window.location.pathname.split('/')[3], []);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectingPlan, setSelectingPlan] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/plans')
      .then(({ items }) => setPlans(items))
      .catch((requestError) => setError(requestError.message));
  }, []);

  async function selectPlan(planKey) {
    if (selectingPlan) return;
    setError('');
    setSelectingPlan(true);
    try {
      const subscription = await api('/subscriptions', {
        body: JSON.stringify({ parentId, planKey }),
        method: 'POST',
      });
      setSelectedPlan({ key: planKey, nextStep: subscription.nextStep });
      window.setTimeout(() => navigate(`/app/parents/${parentId}`), 1200);
    } catch (requestError) {
      setError(requestError.message);
      setSelectingPlan(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-lg border border-border bg-primary-soft p-5 shadow-sm sm:p-6">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Care plan</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            Choose a care plan
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Review the support, pricing, and payment steps in one place.
          </p>
        </header>

        <section
          aria-label="Available care plans"
          className="mt-5 grid items-stretch gap-5 md:grid-cols-3"
        >
          {!error && !plans.length ? (
            <p className="rounded-lg border border-border bg-surface p-5 text-sm text-muted md:col-span-3">
              No care plans are available yet. Please check again later.
            </p>
          ) : null}
          {plans.map((plan) => {
            const detail = planDetails[plan.key];
            const price = `${plan.currency} ${plan.price.min}–${plan.price.max}`;
            return (
              <article
                aria-label={`${plan.key}, ${price} per month`}
                className="flex min-h-80 flex-col rounded-lg border border-border bg-surface p-5 shadow-sm transition-all duration-150 hover:-translate-y-1 hover:border-primary hover:shadow-md motion-reduce:transform-none"
                key={plan.key}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-semibold text-text">{plan.key}</h2>
                    <span className="rounded-full bg-primary-soft px-2 py-1 text-xs font-medium text-primary">
                      Monthly
                    </span>
                  </div>
                  <p className="mt-2 min-h-10 text-sm leading-5 text-muted">{detail.summary}</p>
                </div>
                <div className="mt-4 border-y border-border py-3">
                  <p className="text-2xl font-bold tabular-nums text-text">{price}</p>
                  <p className="mt-1 text-xs text-muted">per month</p>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-text">
                  <li className="flex gap-2">
                    <span aria-hidden="true" className="text-primary">
                      •
                    </span>
                    {plan.visitsPerWeek === 7
                      ? 'Daily visits'
                      : `${plan.visitsPerWeek} visit${plan.visitsPerWeek === 1 ? '' : 's'} each week`}
                  </li>
                  <li className="flex gap-2">
                    <span aria-hidden="true" className="text-primary">
                      •
                    </span>
                    {plan.errandsPerWeek === 0
                      ? 'No errands included'
                      : plan.errandsPerWeek === 7
                        ? 'Unlimited errands'
                        : `${plan.errandsPerWeek} errand${plan.errandsPerWeek === 1 ? '' : 's'} each week`}
                  </li>
                </ul>
                <Button
                  className="mt-auto w-full"
                  disabled={selectingPlan}
                  loading={selectingPlan}
                  onClick={() => void selectPlan(plan.key)}
                >
                  Select {plan.key}
                </Button>
              </article>
            );
          })}
        </section>
        {error ? <p className="mt-5 text-sm text-emergency">{error}</p> : null}

        {selectedPlan ? (
          <section
            aria-live="polite"
            className="fixed inset-x-4 top-20 z-30 max-w-md border-l-[3px] border-primary bg-primary-soft p-4 text-sm text-text shadow-md sm:left-auto sm:right-6 sm:w-full"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{selectedPlan.key} plan selected</p>
                <p className="mt-2 leading-6 text-muted">{selectedPlan.nextStep}</p>
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

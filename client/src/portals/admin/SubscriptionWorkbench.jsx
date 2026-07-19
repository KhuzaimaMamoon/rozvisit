import { useState } from 'react';
import Button from '../../design-system/Button.jsx';
import FormInput from '../../design-system/FormInput.jsx';
import StatusBadge from '../../design-system/StatusBadge.jsx';

const stateLabels = {
  selected: 'Selected',
  link_sent: 'Link sent',
  active: 'Active',
  grace: 'Grace',
  paused: 'Paused',
  cancelled: 'Cancelled',
};

function statusVariant(state) {
  if (state === 'active') return 'success';
  if (state === 'selected' || state === 'link_sent' || state === 'grace' || state === 'paused') {
    return 'pending';
  }
  return 'neutral';
}

export default function SubscriptionWorkbench() {
  const [state, setState] = useState('link_sent');
  const [activationOpen, setActivationOpen] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');
  const [agreedPrice, setAgreedPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [message, setMessage] = useState('');

  function activate(event) {
    event.preventDefault();
    if (!paymentRef || !agreedPrice) return;
    setMessage(`Activation recorded for ${currency} ${agreedPrice}.`);
    setActivationOpen(false);
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary">RozVisit</p>
            <h1 className="mt-2 text-2xl font-semibold text-text">Subscriptions</h1>
            <p className="mt-2 text-sm text-muted">
              Payment happens outside the app during Phase 1. Record the Payoneer reference on
              activation.
            </p>
          </div>
        </header>

        <div className="mt-6 flex flex-wrap gap-2" aria-label="Subscription state filters">
          {Object.entries(stateLabels).map(([key, label]) => (
            <button
              aria-pressed={state === key}
              className={`rounded-full border px-3 py-2 text-sm font-medium ${state === key ? 'border-primary bg-primary-soft text-primary' : 'border-border bg-surface text-text'}`}
              key={key}
              onClick={() => setState(key)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        <section className="mt-5 overflow-x-auto rounded-md border border-border bg-surface shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <caption className="sr-only">Subscriptions workbench</caption>
            <thead className="bg-surface-sunken text-xs font-semibold text-muted">
              <tr>
                <th className="p-4">Client</th>
                <th className="p-4">Parent</th>
                <th className="p-4">Plan</th>
                <th className="p-4">State</th>
                <th className="p-4">Period end</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className="p-4 font-medium text-text">Ayesha Khan</td>
                <td className="p-4 text-text">Amina Bibi</td>
                <td className="p-4 text-text">Standard</td>
                <td className="p-4">
                  <StatusBadge variant={statusVariant(state)}>{stateLabels[state]}</StatusBadge>
                </td>
                <td className="p-4 text-muted">—</td>
                <td className="p-4">
                  <Button onClick={() => setActivationOpen(true)} variant="ghost">
                    Activate
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
        {message ? (
          <p aria-live="polite" className="mt-4 text-sm text-success">
            {message}
          </p>
        ) : null}

        {activationOpen ? (
          <section
            aria-label="Activate subscription"
            className="mx-auto mt-6 max-w-lg rounded-lg border border-border bg-surface p-5 shadow-lg"
          >
            <h2 className="text-lg font-semibold text-text">Activate subscription</h2>
            <p className="mt-2 text-sm text-muted">
              Record the actual amount agreed with the client. This price is locked to the
              subscription.
            </p>
            <form className="mt-5 space-y-4" onSubmit={activate}>
              <FormInput
                id="payment-reference"
                label="Payoneer reference"
                value={paymentRef}
                onChange={(event) => setPaymentRef(event.target.value)}
              />
              <FormInput
                id="agreed-price"
                label="Agreed price"
                min="0"
                step="0.01"
                type="number"
                value={agreedPrice}
                onChange={(event) => setAgreedPrice(event.target.value)}
              />
              <label className="block text-sm font-medium text-text" htmlFor="agreed-currency">
                Currency
              </label>
              <select
                className="h-10 w-full rounded-sm border border-border bg-surface px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/25"
                id="agreed-currency"
                onChange={(event) => setCurrency(event.target.value)}
                value={currency}
              >
                <option>USD</option>
                <option>GBP</option>
                <option>AED</option>
                <option>SAR</option>
              </select>
              <div className="flex justify-between gap-3 pt-2">
                <Button onClick={() => setActivationOpen(false)} variant="ghost">
                  Cancel
                </Button>
                <Button type="submit">Activate subscription</Button>
              </div>
            </form>
          </section>
        ) : null}
      </div>
    </main>
  );
}

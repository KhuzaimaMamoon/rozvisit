import { useEffect, useState } from 'react';
import { api } from '../../api.js';
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

function filterStyle(state, activeState) {
  const active = state === activeState ? 'ring-2 ring-primary/25 ring-offset-2' : '';
  if (state === 'active') return `border-success bg-success-soft text-success ${active}`;
  if (state === 'cancelled') return `border-primary bg-primary-soft text-primary ${active}`;
  return `border-pending bg-pending-soft text-pending ${active}`;
}

export default function SubscriptionWorkbench() {
  const [state, setState] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [activationOpen, setActivationOpen] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');
  const [agreedPrice, setAgreedPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [message, setMessage] = useState('');

  useEffect(() => {
    api(`/admin/subscriptions${state ? `?state=${state}` : ''}`)
      .then(({ items }) => setSubscriptions(items))
      .catch((error) => setMessage(error.message));
  }, [state]);

  async function activate(event) {
    event.preventDefault();
    if (!paymentRef || !agreedPrice) return;
    try {
      const updated = await api(`/admin/subscriptions/${selectedSubscription.id}/state`, {
        body: JSON.stringify({
          state: 'active',
          paymentRef,
          price: Number(agreedPrice),
          currency,
        }),
        method: 'PATCH',
      });
      setSubscriptions((items) =>
        items.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
      );
      setMessage(`Activation recorded for ${currency} ${agreedPrice}.`);
      setActivationOpen(false);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function sendPaymentLink(subscription) {
    try {
      const updated = await api(`/admin/subscriptions/${subscription.id}/state`, {
        body: JSON.stringify({ state: 'link_sent' }),
        method: 'PATCH',
      });
      setSubscriptions((items) =>
        items.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
      );
      setMessage('Payment link marked as sent.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-lg border border-border bg-primary-soft p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-primary">
                Administration
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
                Subscriptions
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Review a subscription and record its agreed payment when it is activated.
              </p>
            </div>
            <p className="w-full rounded-full border border-border bg-surface px-3 py-2 text-center text-xs font-medium text-primary sm:w-auto">
              Manual payment tracking
            </p>
          </div>
        </header>

        <section className="mt-6 rounded-lg border border-border bg-primary-soft p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-text">Payment is confirmed outside RozVisit</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Enter the Payoneer reference and agreed price only after payment has been verified.
          </p>
        </section>

        <section className="mt-6 overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-lg font-semibold text-text">Subscription records</h2>
              <p className="mt-1 text-sm text-muted">Filter records by their current state.</p>
            </div>
            <div className="flex flex-wrap gap-2" aria-label="Subscription state filters">
              <button
                aria-pressed={state === null}
                className={`rounded-full border px-3 py-2 text-xs font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/25 ${state === null ? 'border-primary bg-primary-soft text-primary ring-2 ring-primary/25 ring-offset-2' : 'border-border bg-surface text-text'}`}
                onClick={() => setState(null)}
                type="button"
              >
                All
              </button>
              {Object.entries(stateLabels).map(([key, label]) => (
                <button
                  aria-pressed={state === key}
                  className={`rounded-full border px-3 py-2 text-xs font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/25 ${filterStyle(key, state)}`}
                  key={key}
                  onClick={() => setState(key)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <caption className="sr-only">Subscriptions workbench</caption>
              <thead className="bg-surface-sunken text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-6 py-3">Client</th>
                  <th className="px-6 py-3">Parent</th>
                  <th className="px-6 py-3">Plan</th>
                  <th className="px-6 py-3">State</th>
                  <th className="px-6 py-3">Period end</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((subscription) => (
                  <tr
                    className="border-t border-border transition-colors hover:bg-background"
                    key={subscription.id}
                  >
                    <td className="px-6 py-5 font-semibold text-text">{subscription.clientName}</td>
                    <td className="px-6 py-5 text-text">{subscription.parentName}</td>
                    <td className="px-6 py-5 text-text">{subscription.planKey}</td>
                    <td className="px-6 py-5">
                      <StatusBadge variant={statusVariant(subscription.state)}>
                        {stateLabels[subscription.state]}
                      </StatusBadge>
                    </td>
                    <td className="px-6 py-5 text-muted">
                      {subscription.currentPeriodEnd
                        ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-6 py-5 text-right">
                      {subscription.state === 'selected' ? (
                        <Button onClick={() => void sendPaymentLink(subscription)}>
                          Send link
                        </Button>
                      ) : subscription.state === 'link_sent' ? (
                        <Button
                          onClick={() => {
                            setSelectedSubscription(subscription);
                            setActivationOpen(true);
                          }}
                        >
                          Activate
                        </Button>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
                {!subscriptions.length ? (
                  <tr>
                    <td className="px-6 py-5 text-muted" colSpan="6">
                      No subscriptions match this filter.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
        {message ? (
          <p
            aria-live="polite"
            className="fixed inset-x-4 bottom-4 z-30 max-w-md border-l-[3px] border-success bg-success-soft p-4 text-sm text-success shadow-md sm:left-auto sm:right-6 sm:w-full"
          >
            {message}
          </p>
        ) : null}

        {activationOpen ? (
          <div className="fixed inset-0 z-10 grid place-items-center bg-text/50 p-4">
            <section
              aria-label="Activate subscription"
              aria-modal="true"
              className="w-full max-w-lg rounded-lg border border-border bg-surface shadow-lg"
              role="dialog"
            >
              <div className="border-b border-border p-5 sm:p-6">
                <p className="text-sm font-medium uppercase tracking-wide text-primary">
                  Payment confirmation
                </p>
                <h2 className="mt-1 text-xl font-semibold text-text">Activate subscription</h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Record the actual amount agreed with the client. This price is locked to the
                  subscription.
                </p>
              </div>
              <form className="space-y-5 p-5 sm:p-6" onSubmit={activate}>
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
                <div className="grid gap-3 border-t border-border pt-5 sm:flex sm:justify-between">
                  <Button
                    className="w-full sm:w-auto"
                    onClick={() => setActivationOpen(false)}
                    variant="ghost"
                  >
                    Cancel
                  </Button>
                  <Button className="w-full sm:w-auto" type="submit">
                    Activate subscription
                  </Button>
                </div>
              </form>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}

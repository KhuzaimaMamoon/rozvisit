import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api.js';
import Button from '../../design-system/Button.jsx';
import StatusBadge from '../../design-system/StatusBadge.jsx';
import { navigateFromLink } from '../../navigation.js';

const states = ['', 'scheduled', 'completed', 'missed', 'parent_declined', 'flagged'];

function variant(status) {
  if (status === 'completed') return 'success';
  if (status === 'flagged') return 'emergency';
  if (status === 'scheduled') return 'pending';
  return 'neutral';
}

export default function VisitsOversight() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const [status, setStatus] = useState(params.get('status') ?? '');
  const [from, setFrom] = useState(params.get('from') ?? '');
  const [to, setTo] = useState(params.get('to') ?? '');
  const [caregiverId, setCaregiverId] = useState(params.get('caregiverId') ?? '');
  const [visits, setVisits] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const query = new URLSearchParams();
    if (status) query.set('status', status);
    if (from) query.set('from', new Date(`${from}T00:00:00`).toISOString());
    if (to) query.set('to', new Date(`${to}T23:59:59`).toISOString());
    if (caregiverId) query.set('caregiverId', caregiverId);
    api(`/admin/visits?${query.toString()}`)
      .then((data) => setVisits(data.items))
      .catch((requestError) => setError(requestError.message));
  }, [caregiverId, from, status, to]);

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-lg border border-border bg-primary-soft p-5 shadow-sm sm:p-6">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            Admin operations
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            Visits oversight
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Review scheduled care, completed evidence, missed visits, and flags.
          </p>
        </header>
        <section className="mt-6 grid gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-4">
          <label className="text-sm text-text">
            Status
            <select
              className="mt-1 w-full border border-border bg-surface p-2"
              onChange={(event) => setStatus(event.target.value)}
              value={status}
            >
              {states.map((state) => (
                <option key={state} value={state}>
                  {state || 'All statuses'}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-text">
            From
            <input
              className="mt-1 w-full border border-border bg-surface p-2"
              onChange={(event) => setFrom(event.target.value)}
              type="date"
              value={from}
            />
          </label>
          <label className="text-sm text-text">
            To
            <input
              className="mt-1 w-full border border-border bg-surface p-2"
              onChange={(event) => setTo(event.target.value)}
              type="date"
              value={to}
            />
          </label>
          <label className="text-sm text-text">
            Caregiver ID
            <input
              className="mt-1 w-full border border-border bg-surface p-2"
              onChange={(event) => setCaregiverId(event.target.value)}
              value={caregiverId}
            />
          </label>
        </section>
        {error ? <p className="mt-4 text-sm text-emergency">{error}</p> : null}
        <section className="mt-6 overflow-x-auto rounded-lg border border-border bg-surface shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border text-muted">
              <tr>
                <th className="p-4">Parent</th>
                <th className="p-4">Caregiver</th>
                <th className="p-4">Scheduled</th>
                <th className="p-4">Status</th>
                <th className="p-4">Flag</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((visit) => (
                <tr className="border-b border-border" key={visit.id}>
                  <td className="p-4">
                    <a
                      className="text-primary underline"
                      href={`/admin/visits/${visit.id}`}
                      onClick={(event) => navigateFromLink(event, `/admin/visits/${visit.id}`)}
                    >
                      {visit.parent?.name ?? 'Unknown parent'}
                    </a>
                  </td>
                  <td className="p-4">{visit.caregiver?.name ?? 'Unassigned'}</td>
                  <td className="p-4">{new Date(visit.scheduledAt).toLocaleString()}</td>
                  <td className="p-4">
                    <StatusBadge variant={variant(visit.status)}>
                      {visit.status.replace('_', ' ')}
                    </StatusBadge>
                  </td>
                  <td className="p-4">{visit.flag && !visit.flag.resolvedAt ? 'Open' : '—'}</td>
                  <td className="p-4 text-right">
                    {visit.status === 'scheduled' && !visit.caregiver ? (
                      <a
                        href={`/admin/visits/${visit.id}/assign`}
                        onClick={(event) =>
                          navigateFromLink(event, `/admin/visits/${visit.id}/assign`)
                        }
                      >
                        <Button>Assign caregiver</Button>
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
              {!visits.length ? (
                <tr>
                  <td className="p-5 text-muted" colSpan="6">
                    No visits match these filters. Scheduled visits appear here after a client has
                    an active subscription and confirms their weekly schedule.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}

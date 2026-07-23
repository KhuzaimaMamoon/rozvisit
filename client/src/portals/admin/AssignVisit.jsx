import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api.js';
import Button from '../../design-system/Button.jsx';
import { navigate } from '../../navigation.js';

export default function AssignVisit() {
  const visitId = useMemo(() => window.location.pathname.split('/').at(-2), []);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api(`/admin/visits/${visitId}/assignment-suggestions`)
      .then((data) => setSuggestions(data.items))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [visitId]);

  async function assign(caregiverId) {
    setError('');
    try {
      await api(`/admin/visits/${visitId}/assign`, {
        body: JSON.stringify({ caregiverId }),
        method: 'POST',
      });
      navigate(`/admin/visits/${visitId}`);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-lg border border-border bg-primary-soft p-5 shadow-sm sm:p-6">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            Admin operations
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            Assign caregiver
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Verified caregivers inside the parent&apos;s service area appear first, followed by the
            nearest out-of-area options. Distance and daily load are shown so you can make an
            informed assignment.
          </p>
        </header>
        {error ? <p className="mt-4 text-sm text-emergency">{error}</p> : null}
        <section className="mt-6 space-y-3">
          {suggestions.map((suggestion) => (
            <article
              className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              key={suggestion.caregiverId}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-text">{suggestion.name}</p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      suggestion.inArea
                        ? 'bg-success-soft text-success'
                        : 'bg-pending-soft text-pending'
                    }`}
                  >
                    {suggestion.inArea ? 'In service area' : 'Outside service area'}
                  </span>
                  {suggestion.continuity ? (
                    <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
                      Previous caregiver
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm font-medium text-text">
                  {suggestion.distanceKm.toFixed(1)} km from parent
                </p>
                <p className="mt-1 text-sm text-muted">
                  Service radius: {suggestion.serviceRadiusKm} km · {suggestion.todayScheduledCount}{' '}
                  scheduled visit
                  {suggestion.todayScheduledCount === 1 ? '' : 's'} today
                </p>
                {!suggestion.inArea ? (
                  <p className="mt-2 text-sm text-pending">
                    This assignment is outside the caregiver&apos;s configured area. Admin may
                    assign them when operationally necessary.
                  </p>
                ) : null}
                {suggestion.blockedReason ? (
                  <p className="mt-1 text-sm text-emergency">{suggestion.blockedReason}</p>
                ) : null}
              </div>
              <Button
                className="w-full sm:w-auto"
                disabled={!suggestion.assignable}
                onClick={() => assign(suggestion.caregiverId)}
                type="button"
              >
                {suggestion.inArea ? 'Assign' : 'Assign out of area'}
              </Button>
            </article>
          ))}
          {loading ? (
            <p className="rounded-lg border border-border bg-surface p-5 text-sm text-muted">
              Finding verified caregivers and calculating distance…
            </p>
          ) : null}
          {!loading && !suggestions.length ? (
            <p className="rounded-lg border border-border bg-surface p-5 text-sm text-muted">
              No verified caregivers are currently available for assignment.
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}

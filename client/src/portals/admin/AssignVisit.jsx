import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api.js';
import BrandMark from '../../design-system/BrandMark.jsx';
import Button from '../../design-system/Button.jsx';
import { navigate } from '../../navigation.js';

export default function AssignVisit() {
  const visitId = useMemo(() => window.location.pathname.split('/').at(-2), []);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/admin/visits/${visitId}/assignment-suggestions`)
      .then((data) => setSuggestions(data.items))
      .catch((requestError) => setError(requestError.message));
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
      <div className="mx-auto max-w-3xl">
        <header className="border-b border-border pb-6">
          <BrandMark />
          <p className="mt-5 text-sm font-medium text-primary">Admin operations</p>
          <h1 className="mt-1 text-3xl font-semibold text-text">Assign caregiver</h1>
          <p className="mt-2 text-sm text-muted">
            Continuity comes first; remaining in-area caregivers are ordered by today&apos;s
            scheduled load.
          </p>
        </header>
        {error ? <p className="mt-4 text-sm text-emergency">{error}</p> : null}
        <section className="mt-6 space-y-3">
          {suggestions.map((suggestion) => (
            <article
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4"
              key={suggestion.caregiverId}
            >
              <div>
                <p className="font-semibold text-text">
                  {suggestion.name}
                  {suggestion.continuity ? ' · Previous caregiver' : ''}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {suggestion.todayScheduledCount} scheduled visit
                  {suggestion.todayScheduledCount === 1 ? '' : 's'} today
                </p>
                {suggestion.blockedReason ? (
                  <p className="mt-1 text-sm text-emergency">{suggestion.blockedReason}</p>
                ) : null}
              </div>
              <Button
                disabled={!suggestion.assignable}
                onClick={() => assign(suggestion.caregiverId)}
                type="button"
              >
                Assign
              </Button>
            </article>
          ))}
          {!suggestions.length ? (
            <p className="rounded-lg border border-border bg-surface p-5 text-sm text-muted">
              No verified caregivers cover this parent&apos;s service area.
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}

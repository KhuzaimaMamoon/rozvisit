import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import ProofFeed from './ProofFeed.jsx';

export default function FeedHome() {
  const [state, setState] = useState({ error: '', items: [], loading: true, selectedId: null });

  useEffect(() => {
    api('/parents')
      .then(({ items }) =>
        setState({
          error: '',
          items,
          loading: false,
          selectedId: items.length === 1 ? items[0].id : null,
        }),
      )
      .catch((error) =>
        setState({ error: error.message, items: [], loading: false, selectedId: null }),
      );
  }, []);

  if (state.loading) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
        <section className="mx-auto max-w-7xl rounded-lg border border-border bg-surface p-6 shadow-sm">
          <p className="text-sm text-muted">Loading your care updates…</p>
        </section>
      </main>
    );
  }
  if (state.error) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
        <section className="mx-auto max-w-7xl rounded-lg border border-emergency bg-emergency-soft p-6 shadow-sm">
          <p className="text-sm text-emergency">{state.error}</p>
        </section>
      </main>
    );
  }
  if (!state.items.length) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-7xl rounded-lg border border-border bg-primary-soft p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Care updates</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            Your care updates
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Add a parent profile before visit updates can appear here.
          </p>
          <a className="mt-5 inline-flex text-sm font-medium text-primary" href="/app/parents/new">
            Add a parent
          </a>
        </div>
      </main>
    );
  }
  if (!state.selectedId) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-7xl rounded-lg border border-border bg-primary-soft p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Care updates</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            Choose a parent
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Select the parent whose visit updates you would like to review.
          </p>
          <label className="mt-6 block text-sm font-medium text-text" htmlFor="feed-parent">
            Care updates for
          </label>
          <select
            className="mt-2 h-10 w-full rounded-sm border border-border bg-surface px-3 text-text"
            id="feed-parent"
            onChange={(event) =>
              setState((current) => ({ ...current, selectedId: event.target.value }))
            }
            value=""
          >
            <option disabled value="">
              Select a parent
            </option>
            {state.items.map((parent) => (
              <option key={parent.id} value={parent.id}>
                {parent.name}
              </option>
            ))}
          </select>
        </div>
      </main>
    );
  }
  return <ProofFeed parentId={state.selectedId} />;
}

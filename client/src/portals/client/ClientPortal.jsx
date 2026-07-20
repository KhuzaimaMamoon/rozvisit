import ParentProfileForm from './ParentProfileForm.jsx';
import FeedHome from './FeedHome.jsx';
import PlanSelection from './PlanSelection.jsx';
import ProofFeed from './ProofFeed.jsx';
import VisitScheduling from './VisitScheduling.jsx';
import NotificationInbox from '../../notifications/NotificationInbox.jsx';
import Account from '../shared/Account.jsx';
import ParentOverview from './ParentOverview.jsx';
import Parents from './Parents.jsx';

export default function ClientPortal() {
  if (window.location.pathname === '/app/notifications') return <NotificationInbox />;
  if (window.location.pathname === '/app/feed') return <FeedHome />;
  if (window.location.pathname === '/app/parents') return <Parents />;
  if (window.location.pathname === '/app/parents/new') return <ParentProfileForm />;
  if (/^\/app\/parents\/[^/]+\/plan$/.test(window.location.pathname)) return <PlanSelection />;
  if (/^\/app\/parents\/[^/]+\/schedule$/.test(window.location.pathname))
    return <VisitScheduling />;
  if (/^\/app\/parents\/[^/]+\/feed$/.test(window.location.pathname)) return <ProofFeed />;
  if (/^\/app\/parents\/[^/]+$/.test(window.location.pathname)) return <ParentOverview />;
  if (window.location.pathname === '/app/account') return <Account />;

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
      <section className="mx-auto max-w-2xl rounded-lg border border-border bg-surface p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">Client portal</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text">Page not found</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          This page is not available. Use the portal navigation to return to your care updates.
        </p>
        <a
          className="mt-6 inline-flex text-sm font-medium text-primary hover:underline"
          href="/app/feed"
        >
          Go to care updates
        </a>
      </section>
    </main>
  );
}

import Today from './Today.jsx';
import VisitFlow from './VisitFlow.jsx';
import ApplicationStatus from './ApplicationStatus.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import NotificationInbox from '../../notifications/NotificationInbox.jsx';
import Account from '../shared/Account.jsx';
import Earnings from './Earnings.jsx';
import MyVisits from './MyVisits.jsx';

export default function CaregiverPortal() {
  const { user } = useAuth();
  if (window.location.pathname === '/care/status') return <ApplicationStatus />;
  if (user?.status && user.status !== 'verified') return <ApplicationStatus />;
  if (window.location.pathname === '/care/notifications') return <NotificationInbox />;
  if (window.location.pathname === '/care/earnings') return <Earnings />;
  if (window.location.pathname === '/care/visits') return <MyVisits />;
  if (window.location.pathname === '/care/account') return <Account />;
  if (window.location.pathname === '/care/today') return <Today />;
  if (/^\/care\/visits\/[^/]+$/.test(window.location.pathname)) return <VisitFlow />;
  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
      <section className="mx-auto max-w-7xl rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">Caregiver portal</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
          Page not found
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          This page is not available. Use the portal navigation to return to today&apos;s visits.
        </p>
        <a
          className="mt-6 inline-flex text-sm font-medium text-primary hover:underline"
          href="/care/today"
        >
          Go to today&apos;s visits
        </a>
      </section>
    </main>
  );
}

import AdminOverview from './AdminOverview.jsx';
import AssignVisit from './AssignVisit.jsx';
import ApplicationDetail from './ApplicationDetail.jsx';
import ApplicationsQueue from './ApplicationsQueue.jsx';
import CaregiversDirectory from './CaregiversDirectory.jsx';
import ClientsDirectory from './ClientsDirectory.jsx';
import SubscriptionWorkbench from './SubscriptionWorkbench.jsx';
import VisitEvidence from './VisitEvidence.jsx';
import NotificationInbox from '../../notifications/NotificationInbox.jsx';
import VisitsOversight from './VisitsOversight.jsx';
import Account from '../shared/Account.jsx';

export default function AdminPortal() {
  if (window.location.pathname === '/admin/notifications') return <NotificationInbox />;
  if (window.location.pathname === '/admin/account') return <Account />;
  if (window.location.pathname === '/admin/subscriptions') return <SubscriptionWorkbench />;
  if (window.location.pathname === '/admin/caregivers') return <CaregiversDirectory />;
  if (window.location.pathname === '/admin/clients') return <ClientsDirectory />;
  if (window.location.pathname === '/admin/applications') return <ApplicationsQueue />;
  if (window.location.pathname === '/admin/visits') return <VisitsOversight />;
  if (/^\/admin\/visits\/[^/]+\/assign$/.test(window.location.pathname)) return <AssignVisit />;
  if (/^\/admin\/visits\/[^/]+$/.test(window.location.pathname)) return <VisitEvidence />;
  if (/^\/admin\/applications\/[^/]+$/.test(window.location.pathname)) {
    return <ApplicationDetail />;
  }

  return <AdminOverview />;
}

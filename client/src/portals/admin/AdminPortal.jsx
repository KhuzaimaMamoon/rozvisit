import ApplicationDetail from './ApplicationDetail.jsx';
import ApplicationsQueue from './ApplicationsQueue.jsx';
import SubscriptionWorkbench from './SubscriptionWorkbench.jsx';

export default function AdminPortal() {
  if (window.location.pathname === '/admin/subscriptions') return <SubscriptionWorkbench />;
  if (window.location.pathname === '/admin/applications') return <ApplicationsQueue />;
  if (/^\/admin\/applications\/[^/]+$/.test(window.location.pathname)) {
    return <ApplicationDetail />;
  }

  return <main className="portal-placeholder">Admin portal</main>;
}

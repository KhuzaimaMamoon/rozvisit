import SubscriptionWorkbench from './SubscriptionWorkbench.jsx';

export default function AdminPortal() {
  if (window.location.pathname === '/admin/subscriptions') return <SubscriptionWorkbench />;

  return <main className="portal-placeholder">Admin portal</main>;
}

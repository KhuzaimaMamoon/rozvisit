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

  return <main className="portal-placeholder">Client portal</main>;
}

import ParentProfileForm from './ParentProfileForm.jsx';
import FeedHome from './FeedHome.jsx';
import PlanSelection from './PlanSelection.jsx';
import ProofFeed from './ProofFeed.jsx';
import VisitScheduling from './VisitScheduling.jsx';

export default function ClientPortal() {
  if (window.location.pathname === '/app/feed') return <FeedHome />;
  if (window.location.pathname === '/app/parents/new') return <ParentProfileForm />;
  if (/^\/app\/parents\/[^/]+\/plan$/.test(window.location.pathname)) return <PlanSelection />;
  if (/^\/app\/parents\/[^/]+\/schedule$/.test(window.location.pathname))
    return <VisitScheduling />;
  if (/^\/app\/parents\/[^/]+\/feed$/.test(window.location.pathname)) return <ProofFeed />;

  return <main className="portal-placeholder">Client portal</main>;
}

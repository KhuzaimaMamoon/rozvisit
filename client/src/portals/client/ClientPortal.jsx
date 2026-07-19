import ParentProfileForm from './ParentProfileForm.jsx';
import PlanSelection from './PlanSelection.jsx';

export default function ClientPortal() {
  if (window.location.pathname === '/app/parents/new') return <ParentProfileForm />;
  if (/^\/app\/parents\/[^/]+\/plan$/.test(window.location.pathname)) return <PlanSelection />;

  return <main className="portal-placeholder">Client portal</main>;
}

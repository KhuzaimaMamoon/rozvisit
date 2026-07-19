import ParentProfileForm from './ParentProfileForm.jsx';

export default function ClientPortal() {
  if (window.location.pathname === '/app/parents/new') return <ParentProfileForm />;

  return <main className="portal-placeholder">Client portal</main>;
}

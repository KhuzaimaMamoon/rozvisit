import Today from './Today.jsx';
import VisitFlow from './VisitFlow.jsx';

export default function CaregiverPortal() {
  if (window.location.pathname === '/care/today') return <Today />;
  if (/^\/care\/visits\/[^/]+$/.test(window.location.pathname)) return <VisitFlow />;
  return <main className="portal-placeholder">Caregiver portal</main>;
}

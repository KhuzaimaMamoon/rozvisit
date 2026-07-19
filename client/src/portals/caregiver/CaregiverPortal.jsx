import Today from './Today.jsx';
import VisitFlow from './VisitFlow.jsx';
import ApplicationStatus from './ApplicationStatus.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function CaregiverPortal() {
  const { user } = useAuth();
  if (window.location.pathname === '/care/status') return <ApplicationStatus />;
  if (user?.status && user.status !== 'verified') return <ApplicationStatus />;
  if (window.location.pathname === '/care/today') return <Today />;
  if (/^\/care\/visits\/[^/]+$/.test(window.location.pathname)) return <VisitFlow />;
  return <main className="portal-placeholder">Caregiver portal</main>;
}

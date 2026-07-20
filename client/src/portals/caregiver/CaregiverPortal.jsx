import Today from './Today.jsx';
import VisitFlow from './VisitFlow.jsx';
import ApplicationStatus from './ApplicationStatus.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import NotificationInbox from '../../notifications/NotificationInbox.jsx';
import Account from '../shared/Account.jsx';
import Earnings from './Earnings.jsx';

export default function CaregiverPortal() {
  const { user } = useAuth();
  if (window.location.pathname === '/care/status') return <ApplicationStatus />;
  if (user?.status && user.status !== 'verified') return <ApplicationStatus />;
  if (window.location.pathname === '/care/notifications') return <NotificationInbox />;
  if (window.location.pathname === '/care/earnings') return <Earnings />;
  if (window.location.pathname === '/care/account') return <Account />;
  if (window.location.pathname === '/care/today') return <Today />;
  if (/^\/care\/visits\/[^/]+$/.test(window.location.pathname)) return <VisitFlow />;
  return <main className="portal-placeholder">Caregiver portal</main>;
}

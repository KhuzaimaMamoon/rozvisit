import { lazy, Suspense, useEffect, useState } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import BrandMark from './design-system/BrandMark.jsx';
import ErrorBoundary from './design-system/ErrorBoundary.jsx';
import PortalShell from './design-system/PortalShell.jsx';
import Apply from './portals/public/Apply.jsx';
import ForgotPassword from './portals/public/ForgotPassword.jsx';
import Login from './portals/public/Login.jsx';
import Register from './portals/public/Register.jsx';
import ResetPassword from './portals/public/ResetPassword.jsx';
import StaticPage from './portals/public/StaticPage.jsx';
import VerifyEmail from './portals/public/VerifyEmail.jsx';
import VerifyPrompt from './portals/public/VerifyPrompt.jsx';

const portals = {
  client: lazy(() => import('./portals/client/ClientPortal.jsx')),
  caregiver: lazy(() => import('./portals/caregiver/CaregiverPortal.jsx')),
  admin: lazy(() => import('./portals/admin/AdminPortal.jsx')),
};

function resolvePortal(pathname) {
  const [, portal] = pathname.split('/');
  if (portal === 'care') return portals.caregiver;
  if (portal === 'app') return portals.client;
  return portals[portal] ?? null;
}

function ProtectedPortal({ pathname, Portal }) {
  const { loading, user } = useAuth();
  const [, routeRoot] = pathname.split('/');
  const requiredRole =
    routeRoot === 'care' ? 'caregiver' : routeRoot === 'app' ? 'client' : 'admin';

  useEffect(() => {
    if (!loading && (!user || user.role !== requiredRole)) window.location.replace('/login');
  }, [loading, requiredRole, user]);

  if (loading || !user || user.role !== requiredRole) {
    return <main className="portal-placeholder text-sm text-muted">Loading your portal…</main>;
  }
  return (
    <PortalShell>
      <Portal />
    </PortalShell>
  );
}

function NotFound() {
  const { user } = useAuth();
  const destination = user
    ? user.role === 'admin'
      ? '/admin'
      : user.role === 'caregiver'
        ? '/care/today'
        : '/app/feed'
    : '/login';
  return (
    <main className="portal-placeholder bg-background px-4">
      <section className="w-full max-w-md rounded-lg border border-border bg-surface p-6 text-center shadow-sm">
        <BrandMark className="justify-center" />
        <h1 className="mt-6 text-2xl font-semibold text-text">This page doesn&apos;t exist</h1>
        <a
          className="mt-5 inline-block text-sm font-medium text-primary underline"
          href={destination}
        >
          Go to your home
        </a>
      </section>
    </main>
  );
}

export default function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const updatePathname = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', updatePathname);
    return () => window.removeEventListener('popstate', updatePathname);
  }, []);

  const Portal = resolvePortal(pathname);

  if (pathname === '/') {
    window.history.replaceState({}, '', '/login');
    return <Login />;
  }
  if (pathname === '/login') return <Login />;
  if (pathname === '/register') return <Register />;
  if (pathname === '/apply') return <Apply />;
  if (pathname === '/forgot') return <ForgotPassword />;
  if (pathname === '/reset') return <ResetPassword />;
  if (pathname === '/verify-email') return <VerifyPrompt />;
  if (pathname === '/verify') return <VerifyEmail />;
  if (pathname === '/privacy') return <StaticPage kind="privacy" />;
  if (pathname === '/terms') return <StaticPage kind="terms" />;
  if (!Portal) return <NotFound />;

  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <main className="portal-placeholder bg-background text-center">
            <div className="rounded-md border border-border bg-surface px-6 py-5 shadow-sm">
              <BrandMark className="mx-auto" />
              <p className="mt-2 text-sm text-muted">Waking up — just a moment</p>
            </div>
          </main>
        }
      >
        <ProtectedPortal pathname={pathname} Portal={Portal} />
      </Suspense>
    </ErrorBoundary>
  );
}

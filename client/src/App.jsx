import { lazy, Suspense, useEffect, useState } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import Login from './portals/public/Login.jsx';
import Register from './portals/public/Register.jsx';

const portals = {
  client: lazy(() => import('./portals/client/ClientPortal.jsx')),
  caregiver: lazy(() => import('./portals/caregiver/CaregiverPortal.jsx')),
  admin: lazy(() => import('./portals/admin/AdminPortal.jsx')),
};

function resolvePortal(pathname) {
  const [, portal] = pathname.split('/');
  if (portal === 'care') return portals.caregiver;
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
  return <Portal />;
}

export default function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const updatePathname = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', updatePathname);
    return () => window.removeEventListener('popstate', updatePathname);
  }, []);

  const Portal = resolvePortal(pathname);

  if (pathname === '/login') return <Login />;
  if (pathname === '/register') return <Register />;
  if (!Portal) return <main className="portal-placeholder">This page doesn&apos;t exist.</main>;

  return (
    <Suspense
      fallback={
        <main className="portal-placeholder bg-background text-center">
          <div className="rounded-md border border-border bg-surface px-6 py-5 shadow-sm">
            <p className="text-sm font-semibold text-primary">RozVisit</p>
            <p className="mt-2 text-sm text-muted">Waking up — just a moment</p>
          </div>
        </main>
      }
    >
      <ProtectedPortal pathname={pathname} Portal={Portal} />
    </Suspense>
  );
}

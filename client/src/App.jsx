import { lazy, Suspense } from 'react';

const portals = {
  client: lazy(() => import('./portals/client/ClientPortal.jsx')),
  caregiver: lazy(() => import('./portals/caregiver/CaregiverPortal.jsx')),
  admin: lazy(() => import('./portals/admin/AdminPortal.jsx')),
};

function resolvePortal() {
  const [, portal] = window.location.pathname.split('/');
  return portals[portal] ?? portals.client;
}

export default function App() {
  const Portal = resolvePortal();

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
      <Portal />
    </Suspense>
  );
}

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
    <Suspense fallback={<main className="portal-placeholder">Loading RozVisit…</main>}>
      <Portal />
    </Suspense>
  );
}

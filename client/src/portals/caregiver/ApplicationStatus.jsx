import StatusBadge from '../../design-system/StatusBadge.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const statusCopy = Object.freeze({
  applied: 'We have received your application. Our team will review your information.',
  in_review: 'Your application is being reviewed. We will contact you about the next step.',
  rejected: 'Your application was not approved. Please contact support if you need clarification.',
});

export default function ApplicationStatus() {
  const { user } = useAuth();
  const status = user?.status ?? 'applied';
  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-lg border border-border bg-primary-soft p-5 shadow-sm sm:p-6">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">
            Caregiver application
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            Application status
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Follow the progress of your RozVisit caregiver application.
          </p>
        </header>
        <section className="mt-6 max-w-2xl rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6">
          <div>
            <StatusBadge variant="pending">{status.replace('_', ' ')}</StatusBadge>
          </div>
          <p className="mt-5 text-sm leading-6 text-muted">
            {statusCopy[status] ??
              'Your application status is being confirmed. Please contact support if this takes longer than expected.'}
          </p>
        </section>
      </div>
    </main>
  );
}

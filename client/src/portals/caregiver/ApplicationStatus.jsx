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
      <section className="mx-auto max-w-xl rounded-lg border border-border bg-surface p-6 shadow-sm sm:p-8">
        <p className="text-lg font-semibold text-primary">RozVisit</p>
        <h1 className="mt-7 text-3xl font-semibold tracking-tight text-text">Application status</h1>
        <div className="mt-5">
          <StatusBadge variant="pending">{status.replace('_', ' ')}</StatusBadge>
        </div>
        <p className="mt-5 text-sm leading-6 text-muted">
          {statusCopy[status] ??
            'Your application status is being confirmed. Please contact support if this takes longer than expected.'}
        </p>
      </section>
    </main>
  );
}

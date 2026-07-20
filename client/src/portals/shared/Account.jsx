import Button from '../../design-system/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { navigate } from '../../navigation.js';

export default function Account() {
  const { logout, user } = useAuth();
  async function signOut() {
    await logout();
    navigate('/login');
  }
  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-lg border border-border bg-primary-soft p-5 shadow-sm sm:p-6">
          <p className="text-sm font-medium uppercase tracking-wide text-primary">Account</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
            Your account
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">
            Review the details used for your RozVisit account.
          </p>
        </header>
        <section className="mt-6 rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6">
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-md bg-primary-soft p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">Name</dt>
              <dd className="mt-2 font-medium text-text">{user?.name ?? 'RozVisit user'}</dd>
            </div>
            <div className="rounded-md bg-primary-soft p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">Email</dt>
              <dd className="mt-2 font-medium text-text">
                {user?.email ?? 'Available after your next sign-in.'}
              </dd>
            </div>
            <div className="rounded-md bg-primary-soft p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">Role</dt>
              <dd className="mt-2 font-medium capitalize text-text">{user?.role}</dd>
            </div>
          </dl>
          <Button className="mt-6" onClick={() => void signOut()} variant="secondary">
            Log out
          </Button>
        </section>
      </div>
    </main>
  );
}

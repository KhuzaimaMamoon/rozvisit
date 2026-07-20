import BrandMark from '../../design-system/BrandMark.jsx';
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
      <section className="mx-auto max-w-xl rounded-lg border border-border bg-surface p-6 shadow-sm">
        <BrandMark />
        <p className="mt-6 text-sm font-medium text-primary">Account</p>
        <h1 className="mt-1 text-3xl font-semibold text-text">Your account</h1>
        <dl className="mt-6 space-y-4 text-sm">
          <div>
            <dt className="text-muted">Name</dt>
            <dd className="mt-1 font-medium text-text">{user?.name ?? 'RozVisit user'}</dd>
          </div>
          <div>
            <dt className="text-muted">Email</dt>
            <dd className="mt-1 font-medium text-text">
              {user?.email ?? 'Available after your next sign-in.'}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Role</dt>
            <dd className="mt-1 font-medium capitalize text-text">{user?.role}</dd>
          </div>
        </dl>
        <Button className="mt-7" onClick={() => void signOut()} variant="secondary">
          Log out
        </Button>
      </section>
    </main>
  );
}

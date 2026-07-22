import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { roleHome, useAuth } from '../context/AuthContext.jsx';
import { navigate, navigateFromLink } from '../navigation.js';
import AppFooter from './AppFooter.jsx';
import BrandMark from './BrandMark.jsx';

const linksByRole = Object.freeze({
  admin: [
    ['Overview', '/admin'],
    ['Applications', '/admin/applications'],
    ['Caregivers', '/admin/caregivers'],
    ['Clients', '/admin/clients'],
    ['Visits', '/admin/visits'],
    ['Subscriptions', '/admin/subscriptions'],
  ],
  caregiver: [
    ['Today', '/care/today'],
    ['My visits', '/care/visits'],
    ['Earnings', '/care/earnings'],
  ],
  client: [
    ['Care updates', '/app/feed'],
    ['My parents', '/app/parents'],
  ],
});

function detailBack(pathname) {
  if (/^\/care\/visits\/[^/]+$/.test(pathname)) return ['Back to today', '/care/today'];
  if (/^\/admin\/applications\/[^/]+$/.test(pathname)) {
    return ['Back to applications', '/admin/applications'];
  }
  if (/^\/admin\/visits\/[^/]+(?:\/assign)?$/.test(pathname)) {
    return ['Back to visits', '/admin/visits'];
  }
  const parentMatch = pathname.match(/^\/app\/parents\/([^/]+)\/(?:plan|schedule|feed|edit)$/);
  if (parentMatch) return ['Back to parent', `/app/parents/${parentMatch[1]}`];
  if (/^\/app\/parents\/[^/]+$/.test(pathname)) return ['Back to parents', '/app/parents'];
  return null;
}

function isActive(path, href) {
  return path === href || (href !== '/admin' && path.startsWith(`${href}/`));
}

export default function PortalShell({ children }) {
  const { logout, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = window.location.pathname;
  const links = linksByRole[user.role] ?? [];
  const notificationsPath =
    user.role === 'client'
      ? '/app/notifications'
      : user.role === 'caregiver'
        ? '/care/notifications'
        : '/admin/notifications';
  const accountPath =
    user.role === 'client'
      ? '/app/account'
      : user.role === 'caregiver'
        ? '/care/account'
        : '/admin/account';
  const back = useMemo(() => detailBack(pathname), [pathname]);

  useEffect(() => {
    let active = true;
    api('/notifications')
      .then((data) => {
        if (active) setUnreadCount(data.unreadCount ?? 0);
      })
      .catch(() => {
        if (active) setUnreadCount(0);
      });
    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    const refreshUnreadCount = () => {
      api('/notifications')
        .then((data) => setUnreadCount(data.unreadCount ?? 0))
        .catch(() => setUnreadCount(0));
    };
    window.addEventListener('rozvisit:notification-read', refreshUnreadCount);
    return () => window.removeEventListener('rozvisit:notification-read', refreshUnreadCount);
  }, []);

  async function signOut() {
    await logout();
    navigate('/login');
  }

  function closeMenuAndNavigate(event, path) {
    navigateFromLink(event, path);
    setMenuOpen(false);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background text-text">
      <header className="sticky top-0 z-20 border-b border-border bg-surface">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <a href={roleHome(user)} onClick={(event) => navigateFromLink(event, roleHome(user))}>
            <BrandMark />
          </a>
          <nav aria-label="Portal navigation" className="hidden flex-1 gap-1 lg:flex">
            {links.map(([label, href]) => (
              <a
                aria-current={isActive(pathname, href) ? 'page' : undefined}
                className={`shrink-0 rounded-sm px-3 py-2 text-sm font-medium ${isActive(pathname, href) ? 'bg-primary-soft text-primary' : 'text-muted hover:bg-background hover:text-text'}`}
                href={href}
                key={href}
                onClick={(event) => navigateFromLink(event, href)}
              >
                {label}
              </a>
            ))}
          </nav>
          <a
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
            className="relative hidden rounded-sm px-3 py-2 text-sm font-medium text-primary hover:bg-primary-soft lg:block"
            href={notificationsPath}
            onClick={(event) => navigateFromLink(event, notificationsPath)}
          >
            Notifications
            {unreadCount ? (
              <span className="ml-1 inline-flex min-w-5 justify-center rounded-full bg-primary px-1.5 py-0.5 text-xs text-surface">
                {unreadCount}
              </span>
            ) : null}
          </a>
          <a
            className="hidden rounded-sm px-3 py-2 text-sm font-medium text-primary hover:bg-primary-soft lg:block"
            href={accountPath}
            onClick={(event) => navigateFromLink(event, accountPath)}
          >
            Account
          </a>
          <button
            className="hidden rounded-sm px-3 py-2 text-sm font-medium text-primary hover:bg-primary-soft lg:block"
            onClick={() => void signOut()}
            type="button"
          >
            Log out
          </button>
          <button
            aria-controls="portal-mobile-menu"
            aria-expanded={menuOpen}
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-primary hover:bg-primary-soft lg:hidden"
            onClick={() => setMenuOpen(true)}
            type="button"
          >
            Menu
          </button>
        </div>
      </header>
      {menuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Close navigation menu"
            className="absolute inset-0 h-full w-full bg-text/40"
            onClick={() => setMenuOpen(false)}
            type="button"
          />
          <aside
            aria-label="Portal navigation"
            className="relative flex h-full w-72 max-w-full flex-col bg-surface p-5 shadow-lg"
            id="portal-mobile-menu"
          >
            <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-primary">
                  Signed in as
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-text">{user.name}</p>
                <p className="mt-1 truncate text-xs text-muted">{user.email}</p>
              </div>
              <button
                aria-label="Close navigation menu"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border text-lg text-primary hover:bg-primary-soft"
                onClick={() => setMenuOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>
            <nav className="mt-5 space-y-1" aria-label="Mobile portal navigation">
              {links.map(([label, href]) => (
                <a
                  aria-current={isActive(pathname, href) ? 'page' : undefined}
                  className={`block rounded-md px-4 py-3 text-sm font-medium ${isActive(pathname, href) ? 'bg-primary-soft text-primary' : 'text-text hover:bg-background'}`}
                  href={href}
                  key={href}
                  onClick={(event) => closeMenuAndNavigate(event, href)}
                >
                  {label}
                </a>
              ))}
              <a
                className="block rounded-md px-4 py-3 text-sm font-medium text-text hover:bg-background"
                href={notificationsPath}
                onClick={(event) => closeMenuAndNavigate(event, notificationsPath)}
              >
                Notifications{unreadCount ? ` · ${unreadCount} unread` : ''}
              </a>
              <a
                className="block rounded-md px-4 py-3 text-sm font-medium text-text hover:bg-background"
                href={accountPath}
                onClick={(event) => closeMenuAndNavigate(event, accountPath)}
              >
                Account
              </a>
            </nav>
            <button
              className="mt-auto min-h-10 rounded-md border border-border px-4 text-left text-sm font-medium text-primary hover:bg-primary-soft"
              onClick={() => void signOut()}
              type="button"
            >
              Log out
            </button>
          </aside>
        </div>
      ) : null}
      <div className="portal-shell-content flex min-h-0 flex-1 flex-col">
        {back ? (
          <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6">
            <a
              className="text-sm font-medium text-primary underline"
              href={back[1]}
              onClick={(event) => navigateFromLink(event, back[1])}
            >
              {back[0]}
            </a>
          </div>
        ) : null}
        {children}
      </div>
      <AppFooter />
    </div>
  );
}

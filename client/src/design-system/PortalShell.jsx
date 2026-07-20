import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { roleHome, useAuth } from '../context/AuthContext.jsx';
import { navigate, navigateFromLink } from '../navigation.js';
import BrandMark from './BrandMark.jsx';

const linksByRole = Object.freeze({
  admin: [
    ['Overview', '/admin'],
    ['Applications', '/admin/applications'],
    ['Visits', '/admin/visits'],
    ['Subscriptions', '/admin/subscriptions'],
  ],
  caregiver: [
    ['Today', '/care/today'],
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

  async function signOut() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-background text-text">
      <header className="sticky top-0 z-20 border-b border-border bg-surface">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <a href={roleHome(user)} onClick={(event) => navigateFromLink(event, roleHome(user))}>
            <BrandMark />
          </a>
          <nav
            aria-label="Portal navigation"
            className="order-3 flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto sm:flex-1"
          >
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
            className="relative rounded-sm px-3 py-2 text-sm font-medium text-primary hover:bg-primary-soft"
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
            className="rounded-sm px-3 py-2 text-sm font-medium text-primary hover:bg-primary-soft"
            href={accountPath}
            onClick={(event) => navigateFromLink(event, accountPath)}
          >
            Account
          </a>
          <button
            className="rounded-sm px-3 py-2 text-sm font-medium text-primary hover:bg-primary-soft"
            onClick={() => void signOut()}
            type="button"
          >
            Log out
          </button>
        </div>
      </header>
      {back ? (
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
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
      <footer className="border-t border-border bg-surface px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-sm text-muted">
          <p>RozVisit · Clear, accountable care coordination.</p>
          <div className="flex gap-4">
            <a className="font-medium text-primary underline" href="/privacy">
              Privacy
            </a>
            <a className="font-medium text-primary underline" href="/terms">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

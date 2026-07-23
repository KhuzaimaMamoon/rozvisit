import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { api, clearAccessToken, refreshAccessToken, setAccessToken } from '../api.js';

const AuthContext = createContext(null);

function roleForProtectedPath(pathname) {
  const root = pathname.split('/')[1];
  if (root === 'app') return 'client';
  if (root === 'care') return 'caregiver';
  if (root === 'admin') return 'admin';
  return null;
}

export function roleHome(user) {
  if (user.role === 'caregiver') {
    return user.status && user.status !== 'verified' ? '/care/status' : '/care/today';
  }
  if (user.role === 'admin') return '/admin';
  return '/app/feed';
}

export function AuthProvider({ children }) {
  const bootstrapRole = useRef(roleForProtectedPath(window.location.pathname)).current;
  const [session, setSession] = useState({ loading: Boolean(bootstrapRole), user: null });
  const sessionGeneration = useRef(0);

  useEffect(() => {
    // Public authentication screens must not start a speculative refresh. On
    // slower mobile connections that request can finish after a successful
    // login and race the newly issued session. Protected direct URLs still do
    // a silent, role-scoped refresh before their route guard makes a decision.
    if (!bootstrapRole) return undefined;

    let active = true;
    const generation = ++sessionGeneration.current;
    refreshAccessToken(bootstrapRole)
      .then(({ user }) => {
        if (!active || generation !== sessionGeneration.current) return;
        setSession({ loading: false, user: user ?? null });
      })
      .catch(() => {
        if (active && generation === sessionGeneration.current) {
          setSession({ loading: false, user: null });
        }
      });
    return () => {
      active = false;
    };
  }, [bootstrapRole]);

  const value = useMemo(
    () => ({
      ...session,
      async login({ email, password }) {
        const data = await api('/auth/login', {
          body: JSON.stringify({ email, password }),
          method: 'POST',
          retry: false,
        });
        sessionGeneration.current += 1;
        setAccessToken(data.accessToken);
        const user = { ...data.user, email };
        // WebKit can process the history navigation before an ordinary batched
        // state update commits. Commit the authenticated user first so the
        // protected-route guard cannot observe a transient logged-out state.
        flushSync(() => setSession({ loading: false, user }));
        return user;
      },
      async logout() {
        try {
          await api('/auth/logout', { method: 'POST', retry: false });
        } finally {
          sessionGeneration.current += 1;
          clearAccessToken();
          setSession({ loading: false, user: null });
        }
      },
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}

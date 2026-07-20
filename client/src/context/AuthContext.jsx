import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, clearAccessToken, refreshAccessToken, setAccessToken } from '../api.js';

const AuthContext = createContext(null);

function roleFromAccessToken(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(payload)).role ?? null;
  } catch {
    return null;
  }
}

export function roleHome(user) {
  if (user.role === 'caregiver') {
    return user.status && user.status !== 'verified' ? '/care/status' : '/care/today';
  }
  if (user.role === 'admin') return '/admin';
  return '/app/feed';
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState({ loading: true, user: null });

  useEffect(() => {
    let active = true;
    refreshAccessToken()
      .then((token) => {
        const role = roleFromAccessToken(token);
        if (active && role) setSession({ loading: false, user: { role, status: null } });
        else if (active) setSession({ loading: false, user: null });
      })
      .catch(() => {
        if (active) setSession({ loading: false, user: null });
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      ...session,
      async login({ email, password }) {
        const data = await api('/auth/login', {
          body: JSON.stringify({ email, password }),
          method: 'POST',
          retry: false,
        });
        setAccessToken(data.accessToken);
        const user = { ...data.user, email };
        setSession({ loading: false, user });
        return user;
      },
      async logout() {
        try {
          await api('/auth/logout', { method: 'POST', retry: false });
        } finally {
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

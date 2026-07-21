import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, clearAccessToken, refreshAccessToken, setAccessToken } from '../api.js';

const AuthContext = createContext(null);

export function roleHome(user) {
  if (user.role === 'caregiver') {
    return user.status && user.status !== 'verified' ? '/care/status' : '/care/today';
  }
  if (user.role === 'admin') return '/admin';
  return '/app/feed';
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState({ loading: true, user: null });
  const sessionGeneration = useRef(0);

  useEffect(() => {
    let active = true;
    const generation = ++sessionGeneration.current;
    refreshAccessToken()
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
        sessionGeneration.current += 1;
        setAccessToken(data.accessToken);
        const user = { ...data.user, email };
        setSession({ loading: false, user });
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

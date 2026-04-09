'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthSession } from '@/lib/types';

interface AuthContextType {
  session: AuthSession | null;
  setSession: (s: AuthSession | null) => void;
  logout: () => void;
  isAdmin: boolean;
  isDonor: boolean;
  isRecipient: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  setSession: () => {},
  logout: () => {},
  isAdmin: false,
  isDonor: false,
  isRecipient: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(null);

  // Persist session in localStorage
  useEffect(() => {
    const stored = localStorage.getItem('organmatch_session');
    if (stored) {
      try { setSessionState(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  const setSession = (s: AuthSession | null) => {
    setSessionState(s);
    if (s) localStorage.setItem('organmatch_session', JSON.stringify(s));
    else localStorage.removeItem('organmatch_session');
  };

  const logout = () => setSession(null);

  return (
    <AuthContext.Provider value={{
      session,
      setSession,
      logout,
      isAdmin: session?.role === 'admin',
      isDonor: session?.role === 'donor',
      isRecipient: session?.role === 'recipient',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

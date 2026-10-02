import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { checkProfileCompleted, signOut as supabaseSignOut, supabase } from './supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  isProfileCompleted: boolean;
  isLoading: boolean;
  refreshAuth: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isAuthenticated: false,
  isProfileCompleted: false,
  isLoading: true,
  refreshAuth: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isProfileCompleted, setIsProfileCompleted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkAuth = async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsAuthenticated(Boolean(currentSession?.user));

      if (currentSession?.user) {
        try {
          const completed = await checkProfileCompleted(currentSession.user.id);
          setIsProfileCompleted(completed);
        } catch {
          setIsProfileCompleted(false);
        }
      } else {
        setIsProfileCompleted(false);
      }
    } catch (err) {
      console.warn('Error al verificar sesión inicial:', err);
      setSession(null);
      setUser(null);
      setIsAuthenticated(false);
      setIsProfileCompleted(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsAuthenticated(Boolean(currentSession?.user));

        if (event === 'SIGNED_OUT') {
          setIsProfileCompleted(false);
          setIsLoading(false);
          return;
        }

        if (currentSession?.user) {
          try {
            const completed = await checkProfileCompleted(currentSession.user.id);
            setIsProfileCompleted(completed);
          } catch {
            setIsProfileCompleted(false);
          }
        } else {
          setIsProfileCompleted(false);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await supabaseSignOut();
    } finally {
      setSession(null);
      setUser(null);
      setIsAuthenticated(false);
      setIsProfileCompleted(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isAuthenticated,
        isProfileCompleted,
        isLoading,
        refreshAuth: checkAuth,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}

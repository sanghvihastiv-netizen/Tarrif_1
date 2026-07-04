'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { AuthUser } from '../lib/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getStoredUser() {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedUser = window.localStorage.getItem('tariff-user');
  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    window.localStorage.removeItem('tariff-user');
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    setLoading(false);
  }, []);

  const persistUser = (nextUser: AuthUser | null) => {
    setUser(nextUser);
    if (typeof window !== 'undefined') {
      if (nextUser) {
        window.localStorage.setItem('tariff-user', JSON.stringify(nextUser));
      } else {
        window.localStorage.removeItem('tariff-user');
      }
    }
  };

  const signInWithGoogle = async () => {
    const demoUser = {
      id: 0,
      email: 'demo.google@example.com',
      displayName: 'Google User',
    };
    persistUser(demoUser);
  };

  const signInWithGithub = async () => {
    const demoUser = {
      id: 0,
      email: 'demo.github@example.com',
      displayName: 'GitHub User',
    };
    persistUser(demoUser);
  };

  const signInWithEmail = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const text = await response.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error('Unexpected server response');
    }

    if (!response.ok) {
      throw new Error(data.error || 'Invalid email or password');
    }

    persistUser(data.user as AuthUser);
  };

  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName }),
    });

    const text = await response.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error('Unexpected server response');
    }

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create account');
    }

    persistUser(data.user as AuthUser);
  };

  const signOut = async () => {
    persistUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signInWithGoogle,
      signInWithGithub,
      signInWithEmail,
      signUpWithEmail,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
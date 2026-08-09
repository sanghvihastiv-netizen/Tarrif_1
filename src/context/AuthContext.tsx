'use client';

import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  GithubAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { firebaseAuth } from '../lib/firebase';
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


function toAuthUser(user: User): AuthUser {
  return {
    id: user.uid,
    email: user.email,
    displayName: user.displayName || user.email?.split('@')[0] || 'User',
  };
}


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();


  useEffect(() => onAuthStateChanged(firebaseAuth, (firebaseUser) => {
    setUser(firebaseUser ? toAuthUser(firebaseUser) : null);
    setLoading(false);
  }), []);


  const signInWithGoogle = async () => {
    await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
  };


  const signInWithGithub = async () => {
    await signInWithPopup(firebaseAuth, new GithubAuthProvider());
  };


  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
  };


  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    const credential = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
    const name = displayName?.trim();
    if (name) {
      await updateProfile(credential.user, { displayName: name });
      setUser(toAuthUser(credential.user));
    }
  };


  const signOut = async () => {
    await firebaseSignOut(firebaseAuth);
    router.push('/');
  };


  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signInWithGoogle,
      signInWithGithub,
      signInWithEmail,
      signUpWithEmail,
      signOut,
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




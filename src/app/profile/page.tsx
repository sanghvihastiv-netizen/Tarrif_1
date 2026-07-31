'use client';

import Link from 'next/link';
import { ArrowLeft, LogOut, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <main className="min-h-screen bg-[#05080d] text-white">
      <header className="border-b border-white/10 bg-[#05080d]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-sm text-slate-300 hover:text-white">
            <ArrowLeft size={16} />
            Back home
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/20"
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-12 lg:px-8">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20 text-amber-300">
              <User size={28} />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-amber-400">Profile</p>
              <h1 className="mt-2 text-3xl font-semibold">{user?.displayName || 'User'}</h1>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Email</p>
              <p className="mt-2 text-base text-white">{user?.email || 'Not available'}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</p>
              <p className="mt-2 text-base text-emerald-400">Active account</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

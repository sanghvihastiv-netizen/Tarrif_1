'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { User, LogOut, Settings } from 'lucide-react';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsProfileOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Tariff<span className="text-amber-500">Wars</span>
          </Link>

          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-300 hover:text-white transition text-sm">Home</Link>
            <Link href="/simulator" className="text-gray-300 hover:text-white transition text-sm">Simulator</Link>
            <Link href="/scenarios" className="text-gray-300 hover:text-white transition text-sm">Scenarios</Link>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-sm">
                    {user.displayName || user.email?.split('@')[0] || 'User'}
                  </span>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-black/95 border border-white/10 rounded-lg shadow-xl py-1">
                    <div className="px-4 py-2 border-b border-white/10">
                      <p className="text-xs text-gray-400">Signed in as</p>
                      <p className="text-sm text-white truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 transition"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-white/5 transition w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="text-sm text-gray-300 hover:text-white transition">
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-1.5 rounded-md text-sm font-medium transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-gray-400 hover:text-white text-2xl">
            {isOpen ? '✕' : '☰'}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <div className="flex flex-col space-y-3">
              <Link href="/" className="text-gray-300 hover:text-white py-1" onClick={() => setIsOpen(false)}>
                Home
              </Link>
              <Link href="/simulator" className="text-gray-300 hover:text-white py-1" onClick={() => setIsOpen(false)}>
                Simulator
              </Link>
              <Link href="/scenarios" className="text-gray-300 hover:text-white py-1" onClick={() => setIsOpen(false)}>
                Scenarios
              </Link>
              {user ? (
                <>
                  <div className="pt-2 border-t border-white/10">
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                  <button onClick={handleSignOut} className="text-left text-red-400 py-1">
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-gray-300 hover:text-white py-1" onClick={() => setIsOpen(false)}>
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-1.5 rounded-md text-sm font-medium text-center"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
'use client';

import Link from 'next/link';

export default function CTASection() {
  return (
    <section className="py-20 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-amber-900/20 via-transparent to-amber-900/20" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
        <div className="bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-sm">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 rounded-full px-3 py-1 mb-6">
            <span className="text-amber-400">✨</span>
            <span className="text-xs text-amber-400">Ready to calculate</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Build your next landed-cost estimate in minutes.
          </h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Start from route details, product value, shipment mode, and tax rules to understand the real landed cost before booking.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/costs"
              className="group bg-amber-500 hover:bg-amber-600 text-black px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
            >
              Open cost calculator
              <span className="group-hover:translate-x-1 transition">→</span>
            </Link>
            <Link
              href="/login"
              className="border border-white/20 hover:bg-white/5 px-6 py-3 rounded-lg font-semibold transition"
            >
              Sign in
            </Link>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            No hidden fees · Save only the calculations you want to keep
          </p>
        </div>
      </div>
    </section>
  );
}




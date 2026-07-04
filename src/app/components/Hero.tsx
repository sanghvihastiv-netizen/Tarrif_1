'use client';

import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-amber-950/20" />
      <div className="absolute top-40 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[100px]" />


      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-full px-3 py-1 mb-6 border border-white/10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="text-xs text-gray-300">Live Intelligence</span>
        </div>


        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
          Trade Smarter.
          <br />
          <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
            Survive the Tariff Wars.
          </span>
        </h1>


        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          Model global manufacturing, tariffs, logistics disruptions, and geopolitical shocks
          to understand their impact on profitability.
        </p>


        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            href="/login"
            className="group bg-amber-500 hover:bg-amber-600 text-black px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
          >
            Login
            <span className="group-hover:translate-x-1 transition">→</span>
          </Link>
          <Link
            href="/signup"
            className="border border-white/20 hover:bg-white/5 px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
          >
            Create Account
          </Link>
        </div>


        <div className="flex flex-wrap justify-center gap-8 md:gap-12 pt-8 border-t border-white/10">
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-amber-400">50+</div>
            <div className="text-xs text-gray-500">Trade Lanes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-amber-400">8</div>
            <div className="text-xs text-gray-500">Hubs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-amber-400">10</div>
            <div className="text-xs text-gray-500">Shock Models</div>
          </div>
        </div>
      </div>
    </section>
  );
}


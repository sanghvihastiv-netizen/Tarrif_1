import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#030507]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="text-2xl font-bold tracking-tight text-white">
            Tariff<span className="text-amber-500">Wars</span>
          </Link>
          <p className="mt-2 text-sm text-gray-500">Live shipping intelligence engine</p>

          <div className="mt-6 h-px w-12 bg-amber-500/60" />

          <p className="mt-6 text-sm text-gray-400">
            Designed and developed by <span className="font-medium text-white">Hastiv Sanghvi</span>
          </p>

          <div className="mt-7 flex flex-col items-center gap-3 text-xs text-gray-500 sm:flex-row sm:gap-5">
            <p>© 2026 TariffWars. All rights reserved.</p>
            <span className="hidden h-3 w-px bg-white/15 sm:block" />
            <Link href="/terms" className="transition hover:text-amber-400">
              Terms and Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

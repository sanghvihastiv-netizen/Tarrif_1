import type { Metadata } from "next";
import Link from "next/link";
import { LayoutDashboard, Clock, Settings, Ship } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shipping Cost Calculator",
  description: "Estimate shipping costs, duties, and taxes for exporters",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-base-bg font-sans antialiased">
        <header className="border-b border-base-border">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-black">
                SC
              </span>
              <span className="text-lg font-semibold">Shipping Cost</span>
            </Link>
            <nav className="flex items-center gap-2">
              <NavLink href="/dashboard" icon={<LayoutDashboard size={16} />}>
                Dashboard
              </NavLink>
              <NavLink href="/saved" icon={<Clock size={16} />}>
                Saved
              </NavLink>
              <NavLink href="/settings" icon={<Settings size={16} />}>
                Settings
              </NavLink>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-base-muted transition hover:bg-base-card hover:text-white"
    >
      {icon}
      {children}
    </Link>
  );
}

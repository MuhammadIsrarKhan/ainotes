"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/notes" className="font-semibold text-lg">
            AI Notes
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/notes"
              className={`text-sm ${pathname === "/notes" ? "text-white" : "text-zinc-400 hover:text-white"}`}
            >
              Notes
            </Link>
            <Link
              href="/notes/new"
              className={`text-sm ${pathname === "/notes/new" ? "text-white" : "text-zinc-400 hover:text-white"}`}
            >
              New note
            </Link>
            <span className="text-zinc-500 text-sm truncate max-w-[140px]" title={user?.email}>
              {user?.email}
            </span>
            <button
              type="button"
              onClick={logout}
              className="text-sm text-zinc-400 hover:text-white"
            >
              Log out
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

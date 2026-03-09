"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export function AuthGuard({
  children,
  fallback,
  requireAuth = true,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (requireAuth && !user) {
      router.replace("/login");
      return;
    }
    if (!requireAuth && user) {
      router.replace("/notes");
    }
  }, [user, isLoading, requireAuth, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading...</div>
      </div>
    );
  }

  // Protected route: no user -> show fallback (or redirect happens in useEffect)
  if (requireAuth && !user) return fallback ?? null;
  // Public route (e.g. login): user already logged in -> show children (e.g. "Redirecting...")
  if (!requireAuth && user) return <>{children}</>;
  // Public route: no user -> show fallback (login/register form)
  if (!requireAuth && !user) return fallback ?? null;

  return <>{children}</>;
}

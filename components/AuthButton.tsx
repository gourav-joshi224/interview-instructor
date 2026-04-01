"use client";

import { Loader2, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function AuthButton() {
  const pathname = usePathname();
  const { user, loading, signIn, signOut } = useAuth();
  const onLanding = pathname === "/";

  const shellClass = onLanding
    ? "border-white/12 bg-white/10 text-white"
    : "border-[rgba(65,105,67,0.14)] bg-[rgba(255,255,255,0.72)] text-[var(--color-text-primary)]";
  const subtleTextClass = onLanding ? "text-white/70" : "text-[var(--color-text-secondary)]";
  const actionClass = onLanding
    ? "bg-[rgba(176,236,112,0.18)] text-[var(--color-accent)] hover:bg-[rgba(176,236,112,0.24)]"
    : "bg-[rgba(20,69,22,0.08)] text-[var(--color-primary-dark)] hover:bg-[rgba(20,69,22,0.12)]";

  if (loading) {
    return (
      <button
        type="button"
        disabled
        className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold ${shellClass}`}
      >
        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.8} />
        Checking account
      </button>
    );
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => {
          void signIn();
        }}
        className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold transition ${actionClass}`}
      >
        Sign in with Google
      </button>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 rounded-[1.25rem] border px-3 py-2 ${shellClass}`}>
      <div className="min-w-0">
        <p className={`truncate text-[10px] font-semibold uppercase tracking-[0.16em] ${subtleTextClass}`}>
          Signed in
        </p>
        <p className="max-w-[12rem] truncate text-sm font-semibold">{user.name}</p>
      </div>
      <button
        type="button"
        onClick={() => {
          void signOut();
        }}
        className={`inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold transition ${actionClass}`}
      >
        <LogOut className="h-4 w-4" strokeWidth={1.8} />
        Sign out
      </button>
    </div>
  );
}

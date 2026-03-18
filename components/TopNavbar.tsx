"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bell, LayoutDashboard, Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";

const navLinks = [
  { href: "/", label: "Practice" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/result", label: "Report" },
];

export function TopNavbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const onLanding = pathname === "/";
  const shellClass = onLanding
    ? "bg-[rgba(20,69,22,0.86)] text-[var(--color-text-on-dark)]"
    : "border border-[rgba(65,105,67,0.14)] bg-[rgba(255,255,255,0.74)] text-[var(--color-text-primary)] backdrop-blur-xl shadow-[var(--shadow-secondary)]";
  const subTextClass = onLanding ? "text-white/70" : "text-[var(--color-text-secondary)]";
  const iconTone = onLanding ? "text-[var(--color-text-on-dark)]" : "text-[var(--color-text-primary)]";

  return (
    <header className="sticky top-0 z-50 px-[var(--space-lg)] pb-3 pt-4">
      <div className={`mx-auto flex w-full max-w-7xl items-center justify-between rounded-[1.4rem] px-4 py-3 transition-all duration-200 ${shellClass}`}>
        <Link href="/" className="flex min-h-11 items-center gap-3" aria-label="BackendGym home">
          <Logo mode="small" tone={onLanding ? "light" : "dark"} ariaLabel="BackendGym logo" />
          <div className="hidden sm:block">
            <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${subTextClass}`}>
              Interview Training
            </p>
            <p className="text-sm font-semibold">BackendGym</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 sm:flex">
          {navLinks.map((link) => {
            const active = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${active ? "bg-[rgba(176,236,112,0.18)] text-[var(--color-accent)]" : subTextClass}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <button
            type="button"
            aria-label="Notifications"
            className={`relative flex h-11 w-11 items-center justify-center rounded-full border border-white/10 ${onLanding ? "bg-white/10" : "bg-[var(--color-surface-light)]"}`}
          >
            <Bell className={`h-5 w-5 ${iconTone}`} strokeWidth={1.8} />
            <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[var(--color-danger)]" />
          </button>
          <div className={`flex h-11 w-11 items-center justify-center rounded-full font-semibold ${onLanding ? "bg-white/10 text-white" : "bg-[var(--color-primary-dark)] text-[var(--color-text-on-dark)]"}`}>
            BG
          </div>
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          className={`flex h-11 w-11 items-center justify-center rounded-full sm:hidden ${onLanding ? "bg-white/10 text-white" : "bg-[var(--color-surface-light)] text-[var(--color-text-primary)]"}`}
          onClick={() => setMenuOpen((value) => !value)}
        >
          {menuOpen ? <X className="h-5 w-5" strokeWidth={1.8} /> : <Menu className="h-5 w-5" strokeWidth={1.8} />}
        </button>
      </div>

      {menuOpen ? (
        <div className="mx-auto mt-3 flex w-full max-w-7xl flex-col gap-2 rounded-[1.25rem] border border-[rgba(65,105,67,0.14)] bg-[rgba(255,255,255,0.92)] p-3 shadow-[var(--shadow-secondary)] backdrop-blur-xl sm:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-[var(--color-text-primary)]"
            >
              <LayoutDashboard className="h-4 w-4 text-[var(--color-primary)]" strokeWidth={1.8} />
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </header>
  );
}

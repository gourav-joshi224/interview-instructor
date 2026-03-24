"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, LayoutDashboard, Menu, X } from "lucide-react";
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
    ? "border border-white/10 bg-[rgba(20,69,22,0.82)] text-[var(--color-text-on-dark)] shadow-[0_16px_40px_rgba(7,18,8,0.24)]"
    : "border border-[rgba(65,105,67,0.14)] bg-[rgba(255,255,255,0.72)] text-[var(--color-text-primary)] backdrop-blur-xl shadow-[0_16px_36px_rgba(20,69,22,0.08)]";
  const subTextClass = onLanding ? "text-white/70" : "text-[var(--color-text-secondary)]";

  return (
    <header className="sticky top-0 z-50 full-app-shell pb-3 pt-3">
      <div className={`flex w-full items-center justify-between rounded-[1.4rem] px-4 py-3 transition-all duration-200 sm:px-5 ${shellClass}`}>
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
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  active
                    ? onLanding
                      ? "bg-[rgba(176,236,112,0.18)] text-[var(--color-accent)]"
                      : "bg-[rgba(20,69,22,0.08)] text-[var(--color-primary-dark)]"
                    : subTextClass
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/dashboard"
          className={`hidden min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition sm:inline-flex ${
            onLanding
              ? "bg-white/10 text-white hover:bg-white/14"
              : "bg-[rgba(20,69,22,0.06)] text-[var(--color-primary-dark)] hover:bg-[rgba(20,69,22,0.1)]"
          }`}
        >
          Live progress
          <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
        </Link>

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
        <div className="mt-3 flex w-full flex-col gap-2 rounded-[1.25rem] border border-[rgba(65,105,67,0.14)] bg-[rgba(255,255,255,0.92)] p-3 shadow-[var(--shadow-secondary)] backdrop-blur-xl sm:hidden">
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
          <Link
            href="/dashboard"
            onClick={() => setMenuOpen(false)}
            className="flex min-h-11 items-center justify-between rounded-2xl bg-[rgba(20,69,22,0.06)] px-3 py-2 text-sm font-semibold text-[var(--color-primary-dark)]"
          >
            Live progress
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
          </Link>
        </div>
      ) : null}
    </header>
  );
}

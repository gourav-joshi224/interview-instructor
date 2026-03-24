"use client";

import type { ReactNode } from "react";
import { TopNavbar } from "@/components/TopNavbar";

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-dvh bg-[var(--color-background)] text-[var(--color-text-primary)]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-[var(--color-accent)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[var(--color-primary-dark)]">
        Skip to content
      </a>
      <TopNavbar />
      <div id="main-content" className="flex min-h-[calc(100dvh-88px)] flex-col">
        {children}
      </div>
    </div>
  );
}

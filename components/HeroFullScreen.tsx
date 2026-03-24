import Link from "next/link";
import { ArrowRight, BarChart3 } from "lucide-react";
import { ContrastOverlay } from "@/components/ContrastOverlay";
import { FullWidthSection } from "@/components/FullWidthSection";
import { Logo } from "@/components/Logo";

export function HeroFullScreen() {
  return (
    <FullWidthSection
      className="overflow-hidden pt-1"
      contentClassName="full-app-shell pb-4"
      fullBleed
    >
      <div className="hero-panel relative isolate min-h-[calc(100dvh-94px)] overflow-hidden rounded-[2rem] px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="hero-grain" aria-hidden="true" />
        <ContrastOverlay className="rounded-[2rem]" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-2rem] top-1/2 z-0 hidden -translate-y-1/2 lg:block"
        >
          <div className="relative rounded-[2rem] bg-[rgba(255,255,255,0.02)] p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
            <Logo mode="hero" tone="light" className="opacity-[0.14] mix-blend-overlay" />
          </div>
        </div>

        <div className="relative z-10 flex min-h-[78dvh] flex-col justify-between gap-10 lg:flex-row lg:items-center">
          <div className="max-w-3xl space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/12 bg-white/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/72 backdrop-blur-md">
              <Logo mode="icon" tone="light" />
              Structured practice for backend interviews
            </div>

            <div className="space-y-5">
              <h1 className="max-w-2xl text-type-display tracking-[-0.02em] text-[var(--color-text-on-dark)]">
                Turn backend practice into a deliberate system that feels{" "}
                <i className="text-[var(--color-accent)]">effortlessly</i> repeatable.
              </h1>
              <p className="max-w-xl text-base leading-7 text-white/76 sm:text-lg">
                BackendGym gives you a cohesive loop for setup, live answering, scoring,
                and next-step study guidance without changing your current interview flow.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="#setup" className="primary-btn w-full sm:w-auto">
                Start interactive setup
                <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
              </Link>
              <Link
                href="/dashboard"
                className="secondary-btn w-full border-white/35 text-white hover:bg-white/10 sm:w-auto"
              >
                <BarChart3 className="h-4 w-4" strokeWidth={1.8} />
                Open dashboard
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Guided setup", "Topic, experience, mode, and session pressure stay aligned."],
                ["Readable reports", "Contrast-first surfaces keep scores and advice easy to scan."],
                ["Full-bleed flow", "Every major screen now behaves like one product, not loose cards."],
              ].map(([title, body]) => (
                <div
                  key={title}
                  className="rounded-[1.25rem] border border-white/10 bg-white/8 p-4 backdrop-blur-sm"
                >
                  <p className="text-sm font-semibold text-[var(--color-text-on-dark)]">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/72">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex flex-col gap-4 lg:hidden">
            <div className="mx-auto rounded-[1.75rem] bg-[rgba(255,255,255,0.04)] p-4">
              <Logo mode="hero" tone="light" className="mx-auto h-[220px] w-[220px] opacity-[0.16] mix-blend-overlay" />
            </div>
          </div>
        </div>
      </div>
    </FullWidthSection>
  );
}

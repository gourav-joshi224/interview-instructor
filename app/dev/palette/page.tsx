import { Logo } from "@/components/Logo";

const tokens = [
  ["Primary Dark", "var(--color-primary-dark)"],
  ["Primary", "var(--color-primary)"],
  ["Accent", "var(--color-accent)"],
  ["Surface Light", "var(--color-surface-light)"],
  ["Background", "var(--color-background)"],
  ["Text Primary", "var(--color-text-primary)"],
  ["Text Secondary", "var(--color-text-secondary)"],
  ["Success", "var(--color-success)"],
  ["Danger", "var(--color-danger)"],
];

export default function PalettePage() {
  return (
    <div className="page-shell min-h-dvh px-[var(--space-lg)] py-[var(--space-2xl)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="surface-card p-6">
          <p className="section-kicker">Dev Palette</p>
          <h1 className="mt-2 text-type-h1 text-[var(--color-text-primary)]">BackendGym design tokens</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-text-secondary)]">
            Visual QA page for colors, typography, and logo variants used in the redesign.
          </p>
        </div>

        <div className="surface-card p-6">
          <p className="section-kicker">Colors</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tokens.map(([label, value]) => (
              <div key={label} className="rounded-[1.25rem] border border-[rgba(65,105,67,0.14)] p-4">
                <div className="h-20 rounded-[1rem]" style={{ background: value }} />
                <p className="mt-3 text-sm font-semibold text-[var(--color-text-primary)]">{label}</p>
                <p className="mt-1 text-type-caption text-[var(--color-text-secondary)]">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="surface-card p-6">
            <p className="section-kicker">Typography</p>
            <div className="mt-4 space-y-3">
              <p className="text-type-display text-[var(--color-text-primary)]">Display</p>
              <p className="text-type-h1 text-[var(--color-text-primary)]">Heading One</p>
              <p className="text-type-h2 text-[var(--color-text-primary)]">Heading Two</p>
              <p className="text-type-h3 text-[var(--color-text-primary)]">Heading Three</p>
              <p className="text-type-body text-[var(--color-text-primary)]">
                Body copy uses Instrument Sans with a 16px baseline and comfortable line height.
              </p>
              <p className="text-type-caption uppercase text-[var(--color-text-secondary)]">Caption / Overline</p>
            </div>
          </div>

          <div className="surface-card p-6">
            <p className="section-kicker">Logo Variants</p>
            <div className="mt-4 grid gap-4">
              <div className="rounded-[1.25rem] bg-[var(--color-primary-dark)] p-4">
                <Logo mode="small" tone="light" ariaLabel="Light small logo" />
              </div>
              <div className="rounded-[1.25rem] bg-white p-4">
                <Logo mode="small" tone="dark" ariaLabel="Dark small logo" />
              </div>
              <div className="rounded-[1.25rem] bg-[var(--gradient-hero)] p-4">
                <Logo mode="hero" tone="light" ariaLabel="Hero logo" className="mx-auto h-[180px] w-[180px] opacity-[0.16]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

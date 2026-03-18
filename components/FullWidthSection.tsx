import type { HTMLAttributes, ReactNode } from "react";

type FullWidthSectionProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  surface?: "none" | "light" | "gradient" | "dark";
  contentClassName?: string;
};

export function FullWidthSection({
  children,
  className = "",
  contentClassName = "",
  surface = "none",
  ...props
}: FullWidthSectionProps) {
  const surfaceClass =
    surface === "light"
      ? "bg-[rgba(255,255,255,0.72)]"
      : surface === "gradient"
        ? "bg-gradient-surface"
        : surface === "dark"
          ? "bg-[var(--color-primary-dark)] text-[var(--color-text-on-dark)]"
          : "";

  return (
    <section className={`w-full ${surfaceClass} ${className}`.trim()} {...props}>
      <div className={`mx-auto w-full max-w-7xl px-[var(--space-lg)] ${contentClassName}`.trim()}>
        {children}
      </div>
    </section>
  );
}

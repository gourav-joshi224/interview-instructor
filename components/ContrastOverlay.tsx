import type { HTMLAttributes } from "react";

type ContrastOverlayProps = HTMLAttributes<HTMLDivElement> & {
  tone?: "dark" | "accent";
};

export function ContrastOverlay({
  tone = "dark",
  className = "",
  ...props
}: ContrastOverlayProps) {
  const toneClass =
    tone === "accent"
      ? "bg-[radial-gradient(circle_at_center,rgba(176,236,112,0.18),transparent_72%)]"
      : "bg-[linear-gradient(110deg,rgba(13,46,16,0.82)_0%,rgba(13,46,16,0.38)_45%,transparent_100%)]";

  return <div aria-hidden="true" className={`pointer-events-none absolute inset-0 ${toneClass} ${className}`} {...props} />;
}

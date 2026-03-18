import Image from "next/image";

type LogoProps = {
  mode?: "small" | "hero" | "icon";
  tone?: "dark" | "light";
  ariaLabel?: string;
  className?: string;
};

const sizeMap = {
  icon: 28,
  small: 40,
  hero: 520,
} as const;

export function Logo({
  mode = "small",
  tone = "light",
  ariaLabel,
  className = "",
}: LogoProps) {
  const size = sizeMap[mode];
  const toneClass =
    tone === "dark"
      ? "brightness-[0.38] saturate-[1.25] contrast-125"
      : "brightness-100 saturate-110";

  const wrapperClass =
    mode === "hero"
      ? "relative h-[220px] w-[220px] sm:h-[280px] sm:w-[280px] lg:h-[520px] lg:w-[520px]"
      : mode === "icon"
        ? "relative h-7 w-7"
        : "relative h-10 w-10";

  return (
    <div
      className={`${wrapperClass} ${className}`.trim()}
      aria-label={ariaLabel}
      role={ariaLabel ? "img" : undefined}
    >
      <Image
        src="/logo.svg"
        alt={ariaLabel ? ariaLabel : ""}
        fill
        priority={mode !== "icon"}
        sizes={`${size}px`}
        className={`object-contain ${toneClass} ${mode === "hero" ? "drop-shadow-[0_18px_40px_rgba(176,236,112,0.18)]" : ""}`}
      />
    </div>
  );
}

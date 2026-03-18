import type { SkillBreakdown } from "@/lib/types";

const SKILL_CONFIG: Array<{
  key: keyof SkillBreakdown;
  label: string;
}> = [
  { key: "architecture", label: "Architecture" },
  { key: "scalability", label: "Scalability" },
  { key: "dataModeling", label: "Data Modeling" },
  { key: "caching", label: "Caching" },
];

type SkillProgressProps = {
  skills: SkillBreakdown;
};

export function SkillProgress({ skills }: SkillProgressProps) {
  return (
    <div className="space-y-4">
      {SKILL_CONFIG.map((skill) => {
        const value = skills[skill.key];
        const width = `${Math.max(0, Math.min(100, value * 10))}%`;

        return (
          <div key={skill.key} className="space-y-2">
            <div className="flex items-center justify-between text-sm text-[var(--color-text-primary)]">
              <span>{skill.label}</span>
              <span className="numeric-tabular text-[var(--color-text-secondary)]">{value}/10</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[rgba(65,105,67,0.14)]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-primary)_0%,var(--color-accent)_100%)] transition-[width]"
                style={{ width }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

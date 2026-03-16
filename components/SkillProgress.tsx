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
            <div className="flex items-center justify-between text-sm text-zinc-300">
              <span>{skill.label}</span>
              <span className="text-zinc-500">{value}/10</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 transition-[width]"
                style={{ width }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

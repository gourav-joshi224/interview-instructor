import { buildTopicSkillBreakdown } from "@/data/skillMapping";
import type { SkillBreakdown } from "@/lib/types";

type SkillBreakdownChartProps = {
  topic: string;
  score: number;
  missingConcepts: string[];
  skillBreakdown: SkillBreakdown;
};

export function SkillBreakdownChart({
  topic,
  score,
  missingConcepts,
  skillBreakdown,
}: SkillBreakdownChartProps) {
  const items = buildTopicSkillBreakdown({
    topic,
    score,
    missingConcepts,
    genericSkillBreakdown: skillBreakdown,
  });

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.key} className="space-y-2">
          <div className="flex items-center justify-between text-sm text-zinc-300">
            <span>{item.label}</span>
            <span className="text-zinc-500">{item.score}/10</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 transition-[width]"
              style={{ width: `${Math.max(0, Math.min(100, item.score * 10))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

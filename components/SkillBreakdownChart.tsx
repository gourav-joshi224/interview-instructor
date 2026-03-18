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
          <div className="flex items-center justify-between text-sm text-[var(--color-text-primary)]">
            <span>{item.label}</span>
            <span className="numeric-tabular text-[var(--color-text-secondary)]">{item.score}/10</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[rgba(65,105,67,0.14)]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-primary)_0%,var(--color-accent)_100%)] transition-[width]"
              style={{ width: `${Math.max(0, Math.min(100, item.score * 10))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

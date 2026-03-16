import type { DashboardData, DashboardInsight, SkillBreakdown, StoredInterviewResult } from "@/lib/types";

const SKILL_LABELS: Record<keyof SkillBreakdown, string> = {
  architecture: "architecture",
  scalability: "scalability",
  dataModeling: "data modeling",
  caching: "caching",
};

export function calculateSkillAverages(interviews: StoredInterviewResult[]): SkillBreakdown {
  if (interviews.length === 0) {
    return {
      architecture: 0,
      scalability: 0,
      dataModeling: 0,
      caching: 0,
    };
  }

  const totals = interviews.reduce(
    (accumulator, interview) => ({
      architecture: accumulator.architecture + interview.skillBreakdown.architecture,
      scalability: accumulator.scalability + interview.skillBreakdown.scalability,
      dataModeling: accumulator.dataModeling + interview.skillBreakdown.dataModeling,
      caching: accumulator.caching + interview.skillBreakdown.caching,
    }),
    {
      architecture: 0,
      scalability: 0,
      dataModeling: 0,
      caching: 0,
    },
  );

  return {
    architecture: Math.round((totals.architecture / interviews.length) * 10) / 10,
    scalability: Math.round((totals.scalability / interviews.length) * 10) / 10,
    dataModeling: Math.round((totals.dataModeling / interviews.length) * 10) / 10,
    caching: Math.round((totals.caching / interviews.length) * 10) / 10,
  };
}

export function buildInsight(averages: SkillBreakdown): DashboardInsight {
  const entries = Object.entries(averages) as Array<[keyof SkillBreakdown, number]>;
  const strongest = entries.reduce((best, current) => (current[1] > best[1] ? current : best));
  const weakest = entries.reduce((best, current) => (current[1] < best[1] ? current : best));

  return {
    strongestSkill: strongest[0],
    weakestSkill: weakest[0],
    strongestMessage: `Your strongest skill is ${SKILL_LABELS[strongest[0]]}.`,
    improvementMessage: `You should improve ${SKILL_LABELS[weakest[0]]}.`,
  };
}

export function buildDashboardData(interviews: StoredInterviewResult[]): DashboardData {
  const averages = calculateSkillAverages(interviews);
  const insight = buildInsight(averages);
  const latestScores = [...interviews]
    .slice(0, 10)
    .reverse()
    .map((interview, index) => ({
      interviewId: interview.interviewId ?? `session-${index + 1}`,
      label: `#${index + 1}`,
      score: interview.score,
    }));

  return {
    interviews,
    averages,
    latestScores,
    insight,
  };
}

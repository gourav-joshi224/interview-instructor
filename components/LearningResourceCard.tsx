import type { EvaluationResource } from "@/lib/types";

type LearningResourceCardProps = {
  resource: EvaluationResource;
};

export function LearningResourceCard({ resource }: LearningResourceCardProps) {
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noreferrer"
      className="block rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 transition hover:border-blue-400/30 hover:bg-blue-500/[0.06]"
    >
      <p className="text-sm font-medium text-zinc-100">{resource.title}</p>
      <p className="mt-1 text-sm text-blue-300">{resource.url}</p>
    </a>
  );
}

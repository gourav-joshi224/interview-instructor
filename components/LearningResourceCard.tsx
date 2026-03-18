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
      className="block rounded-[1.1rem] border border-[rgba(65,105,67,0.14)] bg-[var(--color-surface-light)] px-4 py-4 transition hover:border-[rgba(65,105,67,0.28)] hover:bg-[rgba(176,236,112,0.2)]"
    >
      <p className="text-sm font-medium text-[var(--color-text-primary)]">{resource.title}</p>
      <p className="mt-1 break-all text-sm text-[var(--color-primary)]">{resource.url}</p>
    </a>
  );
}

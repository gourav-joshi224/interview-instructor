"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

type FollowUpQuestionCardProps = {
  followUpQuestion: string;
  topic: string;
  experience: string;
  difficulty: string;
  mode?: "standard" | "resume";
};

export function FollowUpQuestionCard({
  followUpQuestion,
  topic,
  experience,
  difficulty,
  mode = "standard",
}: FollowUpQuestionCardProps) {
  const router = useRouter();

  const params = new URLSearchParams({
    topic,
    experience,
    difficulty,
    mode,
    totalQuestions: "5",
    followUpQuestion,
  });

  const handleClick = () => {
    router.push(`/interview?${params.toString()}`);
  };

  if (!followUpQuestion.trim()) {
    return (
      <div className="rounded-[1.1rem] border border-[rgba(65,105,67,0.14)] bg-[var(--color-surface-light)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
        Follow-up question is not available for this response.
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="block w-full rounded-[1.1rem] border border-[rgba(65,105,67,0.18)] bg-[rgba(176,236,112,0.18)] px-4 py-4 text-left text-sm leading-7 text-[var(--color-text-primary)] transition hover:border-[rgba(65,105,67,0.3)] hover:bg-[rgba(176,236,112,0.26)]"
    >
      <p>{followUpQuestion}</p>
      <span className="mt-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-primary-dark)]">
        Answer this follow-up
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} />
      </span>
    </button>
  );
}

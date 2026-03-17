"use client";

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
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-zinc-400">
        Follow-up question is not available for this response.
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="block w-full rounded-2xl border border-cyan-400/25 bg-cyan-500/[0.06] px-4 py-3 text-left text-sm leading-7 text-zinc-200 transition hover:border-cyan-300/45 hover:bg-cyan-500/[0.12]"
    >
      <p>{followUpQuestion}</p>
      <p className="mt-2 text-xs uppercase tracking-[0.24em] text-cyan-300">
        Click to answer this follow-up
      </p>
    </button>
  );
}

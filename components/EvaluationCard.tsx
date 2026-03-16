"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { SkillProgress } from "@/components/SkillProgress";
import type { StoredInterviewResult } from "@/lib/types";

type EvaluationCardProps = {
  result: StoredInterviewResult;
};

function ListSection({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <section className="space-y-3">
      <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">{title}</p>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm leading-6 text-zinc-300"
          >
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}

export function EvaluationCard({ result }: EvaluationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto flex w-full max-w-5xl flex-col gap-6"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
            Interview Result
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
            AI evaluation and next-step guidance
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-zinc-400">
            Review the score, close the knowledge gaps, and tighten the way you
            explain backend decisions under pressure.
          </p>
        </div>

        <div className="glass-panel flex min-w-[180px] flex-col items-center justify-center text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Score</p>
          <p className="mt-4 text-5xl font-semibold tracking-tight text-zinc-50">
            {result.score}
            <span className="text-xl text-zinc-500">/10</span>
          </p>
          {result.cached ? (
            <p className="mt-3 text-xs uppercase tracking-[0.22em] text-cyan-300">
              Cached result
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-panel space-y-4">
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
            Question
          </p>
          <p className="text-lg leading-8 text-zinc-100">{result.question}</p>
        </div>

        <div className="glass-panel space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
            Session
          </p>
          <div className="grid gap-2 text-sm text-zinc-300">
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-500">Topic</span>
              <span>{result.topic}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-500">Experience</span>
              <span>{result.experience}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-500">Heat mode</span>
              <span>{result.difficulty}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-panel space-y-4">
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
            Your Answer
          </p>
          <p className="text-sm leading-7 text-zinc-300">{result.answer}</p>
        </div>

        <div className="glass-panel space-y-4">
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
            Explanation For You
          </p>
          <p className="text-sm leading-7 text-zinc-300">{result.explanationForUser}</p>
        </div>

        <div className="glass-panel space-y-4">
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
            Learning Resources
          </p>
          {result.learningResources.length > 0 ? (
            <div className="space-y-3">
              {result.learningResources.map((resource) => (
                <a
                  key={resource.url}
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 transition hover:border-blue-400/30 hover:bg-blue-500/[0.06]"
                >
                  <p className="text-sm font-medium text-zinc-100">{resource.title}</p>
                  <p className="mt-1 text-sm text-blue-300">{resource.url}</p>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm leading-7 text-zinc-400">
              No resource links were returned for this evaluation.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-panel">
          <ListSection title="Strengths" items={result.strengths} />
        </div>

        <div className="glass-panel">
          <ListSection title="Missing Concepts" items={result.missingConcepts} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-panel space-y-4">
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
            Follow Up Question
          </p>
          <p className="text-sm leading-7 text-zinc-300">{result.followUpQuestion}</p>
        </div>

        <div className="glass-panel space-y-4">
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
            Skill Breakdown
          </p>
          <SkillProgress skills={result.skillBreakdown} />
        </div>
      </div>

      <div className="flex justify-end">
        <Link
          href="/dashboard"
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-500 px-5 text-sm font-medium text-white"
        >
          Open Dashboard
        </Link>
      </div>
    </motion.div>
  );
}

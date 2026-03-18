"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { FollowUpQuestionCard } from "@/components/FollowUpQuestionCard";
import { LearningResourceCard } from "@/components/LearningResourceCard";
import { SkillBreakdownChart } from "@/components/SkillBreakdownChart";
import type { StoredInterviewResult } from "@/lib/types";

type EvaluationCardProps = {
  result: StoredInterviewResult;
};

function ListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="space-y-3">
      <p className="section-kicker">{title}</p>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item} className="soft-card rounded-[1.1rem] px-4 py-3 text-sm leading-6 text-[var(--color-text-primary)]">
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
      className="mx-auto flex w-full max-w-7xl flex-col gap-6"
    >
      <div className="surface-card overflow-hidden">
        <div className="bg-gradient-balance-card px-6 py-8 text-[var(--color-text-on-dark)] sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Logo mode="small" tone="light" ariaLabel="BackendGym report logo" className="h-9 w-9" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Interview Result</p>
              </div>
              <h1 className="max-w-2xl text-type-h1 text-white">AI evaluation and next-step guidance</h1>
              <p className="max-w-2xl text-sm leading-7 text-white/78">
                Review the score, close the knowledge gaps, and tighten the way you explain backend decisions under pressure.
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-white/10 px-6 py-5 text-center backdrop-blur-sm">
              <p className="section-kicker !text-white/72">Score</p>
              <p className="numeric-tabular mt-3 text-[2.8rem] font-bold leading-none text-white">
                {result.score}
                <span className="ml-1 text-lg text-white/70">/10</span>
              </p>
              {result.cached ? (
                <p className="mt-3 text-type-caption font-semibold uppercase text-[var(--color-accent)]">Cached result</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-4 bg-[rgba(255,255,255,0.4)] px-6 py-5 sm:grid-cols-2 sm:px-8">
          <div>
            <p className="section-kicker">Question</p>
            <p className="mt-2 text-sm leading-7 text-[var(--color-text-primary)]">{result.question}</p>
          </div>
          <div>
            <p className="section-kicker">Session Snapshot</p>
            <p className="mt-2 text-sm leading-7 text-[var(--color-text-primary)]">
              {result.topic} / {result.experience} / {result.difficulty}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
        <div className="surface-card p-6">
          <ListSection title="Strengths" items={result.strengths} />
        </div>
        <div className="surface-card p-6">
          <ListSection title="Missing Concepts" items={result.missingConcepts} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.06fr_0.94fr]">
        <div className="surface-card space-y-4 p-6">
          <p className="section-kicker">How a Strong Candidate Would Answer</p>
          <p className="text-sm leading-7 text-[var(--color-text-primary)]">{result.idealAnswer}</p>
        </div>

        <div className="surface-card space-y-4 p-6">
          <p className="section-kicker">Explanation For You</p>
          <p className="text-sm leading-7 text-[var(--color-text-primary)]">{result.explanationForUser}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.94fr_1.06fr]">
        <div className="surface-card space-y-4 p-6">
          <p className="section-kicker">Follow Up Question</p>
          <FollowUpQuestionCard
            followUpQuestion={result.followUpQuestion}
            topic={result.topic}
            experience={result.experience}
            difficulty={result.difficulty}
            mode={result.mode}
          />
        </div>

        <div className="surface-card space-y-4 p-6">
          <p className="section-kicker">Skill Breakdown</p>
          <SkillBreakdownChart
            topic={result.topic}
            score={result.score}
            missingConcepts={result.missingConcepts}
            skillBreakdown={result.skillBreakdown}
          />
        </div>
      </div>

      <div className="surface-card p-6">
        <p className="section-kicker">Learning Resources</p>
        {result.learningResources.length > 0 ? (
          <div className="mt-4 space-y-3">
            {result.learningResources.map((resource) => (
              <LearningResourceCard key={resource.url} resource={resource} />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm leading-7 text-[var(--color-text-secondary)]">
            No mapped learning resources available for this topic yet.
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="surface-card space-y-4 p-6">
          <p className="section-kicker">Session</p>
          <div className="grid gap-2 text-sm text-[var(--color-text-primary)]">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[var(--color-text-secondary)]">Topic</span>
              <span>{result.topic}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[var(--color-text-secondary)]">Experience</span>
              <span>{result.experience}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[var(--color-text-secondary)]">Heat mode</span>
              <span>{result.difficulty}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[var(--color-text-secondary)]">Mode</span>
              <span>{result.mode === "resume" ? "Resume Based" : "Standard"}</span>
            </div>
            {result.selectedSkill ? (
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--color-text-secondary)]">Skill focus</span>
                <span>{result.selectedSkill}</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="surface-card space-y-4 p-6">
          <p className="section-kicker">Your Answer</p>
          <p className="text-sm leading-7 text-[var(--color-text-primary)]">{result.answer}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Link href="/dashboard" className="primary-btn">
          Open Dashboard
        </Link>
      </div>
    </motion.div>
  );
}

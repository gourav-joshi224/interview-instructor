"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LearningResourceCard } from "@/components/LearningResourceCard";
import type { FinishResponse } from "@/lib/view-types";

type InterviewReportCardProps = {
  report: FinishResponse;
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

export function InterviewReportCard({ report }: InterviewReportCardProps) {
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
                <Logo mode="small" tone="light" ariaLabel="BackendGym final report logo" className="h-9 w-9" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Interview Report</p>
              </div>
              <h1 className="max-w-2xl text-type-h1 text-white">Final interview analysis</h1>
              <p className="max-w-2xl text-sm leading-7 text-white/78">
                Review your overall performance, weak areas, and targeted plan for your next interview round.
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-white/10 px-6 py-5 text-center backdrop-blur-sm">
              <p className="section-kicker !text-white/72">Overall Score</p>
              <p className="numeric-tabular mt-3 text-[2.8rem] font-bold leading-none text-white">
                {report.report.overallScore}
                <span className="ml-1 text-lg text-white/70">/100</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 bg-[rgba(255,255,255,0.4)] px-6 py-5 sm:grid-cols-2 sm:px-8">
          <div>
            <p className="section-kicker">Session</p>
            <p className="mt-2 text-sm leading-7 text-[var(--color-text-primary)]">
              {report.topic} / {report.experience} / {report.difficulty} / {report.totalQuestions} questions
            </p>
          </div>
          <div>
            <p className="section-kicker">Outcome</p>
            <p className="mt-2 text-sm leading-7 text-[var(--color-text-primary)]">
              The interview flow is unchanged; this page only presents the final evaluation in a more readable structure.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="surface-card space-y-4 p-6">
          <p className="section-kicker">Session Details</p>
          <div className="grid gap-2 text-sm text-[var(--color-text-primary)]">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[var(--color-text-secondary)]">Topic</span>
              <span>{report.topic}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[var(--color-text-secondary)]">Experience</span>
              <span>{report.experience}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[var(--color-text-secondary)]">Difficulty</span>
              <span>{report.difficulty}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[var(--color-text-secondary)]">Questions</span>
              <span className="numeric-tabular">{report.totalQuestions}</span>
            </div>
          </div>
        </div>

        <div className="surface-card space-y-4 p-6">
          <p className="section-kicker">Skill Breakdown</p>
          <div className="space-y-3">
            {report.report.skillBreakdown.map((item) => (
              <div key={item.skill} className="space-y-2">
                <div className="flex items-center justify-between text-sm text-[var(--color-text-primary)]">
                  <span className="capitalize">{item.skill}</span>
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
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface-card space-y-4 p-6">
          <p className="section-kicker">Communication Feedback</p>
          <p className="text-sm leading-7 text-[var(--color-text-primary)]">{report.report.communicationFeedback}</p>
        </div>

        <div className="surface-card space-y-4 p-6">
          <p className="section-kicker">Technical Feedback</p>
          <p className="text-sm leading-7 text-[var(--color-text-primary)]">{report.report.technicalFeedback}</p>
        </div>
      </div>

      <div className="surface-card space-y-4 p-6">
        <p className="section-kicker">Improvement Plan</p>
        <p className="text-sm leading-7 text-[var(--color-text-primary)]">{report.report.improvementPlan}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface-card p-6">
          <ListSection title="Strengths" items={report.report.strengths} />
        </div>
        <div className="surface-card p-6">
          <ListSection title="Weak Areas" items={report.report.weakAreas} />
        </div>
      </div>

      <div className="surface-card p-6">
        <p className="section-kicker">Learning Resources</p>
        <div className="mt-4 space-y-3">
          {report.report.learningResources.map((resource) => (
            <LearningResourceCard key={resource.url} resource={resource} />
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Link href="/dashboard" className="secondary-btn">
          Open Dashboard
        </Link>
        <Link href="/" className="primary-btn">
          Start New Session
        </Link>
      </div>
    </motion.div>
  );
}

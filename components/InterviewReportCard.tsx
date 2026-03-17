"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { FinishResponse } from "@/lib/view-types";

type InterviewReportCardProps = {
  report: FinishResponse;
};

function ListSection({ title, items }: { title: string; items: string[] }) {
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

export function InterviewReportCard({ report }: InterviewReportCardProps) {
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
            Interview Report
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
            Final interview analysis
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-zinc-400">
            Review your overall performance, weak areas, and targeted plan for your
            next interview round.
          </p>
        </div>

        <div className="glass-panel flex min-w-[180px] flex-col items-center justify-center text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Overall Score</p>
          <p className="mt-4 text-5xl font-semibold tracking-tight text-zinc-50">
            {report.report.overallScore}
            <span className="text-xl text-zinc-500">/100</span>
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-panel space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Session</p>
          <div className="grid gap-2 text-sm text-zinc-300">
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-500">Topic</span>
              <span>{report.topic}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-500">Experience</span>
              <span>{report.experience}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-500">Difficulty</span>
              <span>{report.difficulty}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-500">Questions</span>
              <span>{report.totalQuestions}</span>
            </div>
          </div>
        </div>

        <div className="glass-panel space-y-4">
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Skill Breakdown</p>
          <div className="space-y-3">
            {report.report.skillBreakdown.map((item) => (
              <div key={item.skill} className="space-y-2">
                <div className="flex items-center justify-between text-sm text-zinc-300">
                  <span className="capitalize">{item.skill}</span>
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
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-panel space-y-4">
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
            Communication Feedback
          </p>
          <p className="text-sm leading-7 text-zinc-300">
            {report.report.communicationFeedback}
          </p>
        </div>

        <div className="glass-panel space-y-4">
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
            Technical Feedback
          </p>
          <p className="text-sm leading-7 text-zinc-300">{report.report.technicalFeedback}</p>
        </div>
      </div>

      <div className="glass-panel space-y-4">
        <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Improvement Plan</p>
        <p className="text-sm leading-7 text-zinc-300">{report.report.improvementPlan}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-panel">
          <ListSection title="Strengths" items={report.report.strengths} />
        </div>
        <div className="glass-panel">
          <ListSection title="Weak Areas" items={report.report.weakAreas} />
        </div>
      </div>

      <div className="glass-panel space-y-4">
        <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Learning Resources</p>
        <div className="space-y-3">
          {report.report.learningResources.map((resource) => (
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
      </div>

      <div className="flex justify-end gap-3">
        <Link
          href="/dashboard"
          className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-5 text-sm font-medium text-zinc-200"
        >
          Open Dashboard
        </Link>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-500 px-5 text-sm font-medium text-white"
        >
          Start New Session
        </Link>
      </div>
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import { Logo } from "@/components/Logo";
import { FullWidthSection } from "@/components/FullWidthSection";
import { ScoreTrendChart } from "@/components/ScoreTrendChart";
import { SkillProgress } from "@/components/SkillProgress";
import type { DashboardData } from "@/lib/types";

type DashboardClientProps = {
  data: DashboardData;
};

export function DashboardClient({ data }: DashboardClientProps) {
  const averageScore =
    data.interviews.length > 0
      ? (
          data.interviews.reduce((sum, item) => sum + item.score, 0) /
          data.interviews.length
        ).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="surface-card overflow-hidden">
        <div className="bg-gradient-balance-card px-6 py-8 text-[var(--color-text-on-dark)] sm:px-8 sm:py-9">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Logo mode="small" tone="light" ariaLabel="BackendGym dashboard logo" className="h-9 w-9" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Dashboard</p>
              </div>
              <h1 className="max-w-2xl text-type-h1 text-white">Interview progress tracker</h1>
              <p className="max-w-2xl text-sm leading-7 text-white/78">
                Review your last 20 sessions, track skill growth, and focus the next round where it matters most.
              </p>
            </div>

            <Link href="/" className="primary-btn w-full sm:w-auto">
              Start new interview
              <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
            </Link>
          </div>
        </div>

        <div className="grid gap-4 bg-[rgba(255,255,255,0.48)] px-6 py-5 sm:grid-cols-3 sm:px-8">
          {[
            ["Sessions", `${data.interviews.length}`],
            ["Average score", averageScore],
            ["Strongest trend", data.insight.strongestMessage],
          ].map(([label, value], index) => (
            <div key={label} className={`soft-card rounded-[1.25rem] p-4 ${index === 2 ? "sm:col-span-1" : ""}`}>
              <p className="section-kicker">{label}</p>
              <p className={`mt-3 ${index === 2 ? "text-sm leading-6 text-[var(--color-text-primary)]" : "numeric-tabular text-type-h2 text-[var(--color-text-primary)]"}`}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      <FullWidthSection surface="none" className="rounded-[1.75rem]" contentClassName="px-0">
        <div className="grid gap-6 lg:grid-cols-[1.04fr_0.96fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="surface-card space-y-5 p-6"
          >
            <div>
              <p className="section-kicker">Skill Averages</p>
              <h2 className="mt-2 section-title">Average skill scores</h2>
            </div>
            <SkillProgress skills={data.averages} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="surface-card space-y-5 p-6"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-surface-light)]">
                <TrendingUp className="h-5 w-5 text-[var(--color-primary-dark)]" strokeWidth={1.8} />
              </div>
              <div>
                <p className="section-kicker">Self Analysis</p>
                <h2 className="mt-1 section-title">Where you stand</h2>
              </div>
            </div>
            <div className="soft-card rounded-[1.25rem] p-5 text-sm leading-7 text-[var(--color-text-primary)]">
              {data.insight.strongestMessage}
            </div>
            <div className="rounded-[1.25rem] border border-[rgba(229,57,53,0.16)] bg-[var(--color-danger-light)] p-5 text-sm leading-7 text-[var(--color-text-primary)]">
              {data.insight.improvementMessage}
            </div>
          </motion.div>
        </div>
      </FullWidthSection>

      <div className="grid gap-6 lg:grid-cols-[1.18fr_0.82fr]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="surface-card space-y-5 p-6"
        >
          <div>
            <p className="section-kicker">Trend Chart</p>
            <h2 className="mt-2 section-title">Recent interview scores</h2>
          </div>
          {data.latestScores.length > 0 ? (
            <ScoreTrendChart data={data.latestScores} />
          ) : (
            <p className="text-sm leading-7 text-[var(--color-text-secondary)]">
              Complete a few interviews to unlock the score trend chart.
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="surface-card space-y-5 p-6"
        >
          <div>
            <p className="section-kicker">Recent Stats</p>
            <h2 className="mt-2 section-title">Last 20 sessions</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="soft-card rounded-[1.25rem] p-5">
              <p className="section-kicker">Sessions</p>
              <p className="numeric-tabular mt-3 text-type-h2 text-[var(--color-text-primary)]">{data.interviews.length}</p>
            </div>
            <div className="soft-card rounded-[1.25rem] p-5">
              <p className="section-kicker">Average Score</p>
              <p className="numeric-tabular mt-3 text-type-h2 text-[var(--color-text-primary)]">{averageScore}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="surface-card space-y-5 p-6"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">Interview History</p>
            <h2 className="mt-2 section-title">Recent evaluations</h2>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">Showing the latest 20 sessions</p>
        </div>

        <div className="grid gap-4">
          {data.interviews.length > 0 ? (
            data.interviews.map((interview) => (
              <div
                key={interview.interviewId ?? `${interview.question}-${interview.score}`}
                className="soft-card rounded-[1.25rem] p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-type-caption uppercase text-[var(--color-text-secondary)]">
                      <span>{interview.topic}</span>
                      <span>/</span>
                      <span>{interview.experience}</span>
                      <span>/</span>
                      <span>{interview.difficulty}</span>
                      {interview.cached ? <span className="rounded-full bg-[rgba(176,236,112,0.35)] px-2 py-1 text-[var(--color-primary-dark)]">Cached</span> : null}
                    </div>
                    <p className="text-sm leading-7 text-[var(--color-text-primary)]">{interview.question}</p>
                    <p className="text-sm text-[var(--color-text-secondary)]">{interview.followUpQuestion}</p>
                  </div>

                  <div className="min-w-[108px] rounded-[1.1rem] bg-[var(--color-primary-dark)] px-4 py-4 text-center text-[var(--color-text-on-dark)]">
                    <p className="section-kicker !text-white/68">Score</p>
                    <p className="numeric-tabular mt-2 text-type-h3 text-white">{interview.score}/10</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm leading-7 text-[var(--color-text-secondary)]">
              No interview history yet. Finish one session and come back here.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

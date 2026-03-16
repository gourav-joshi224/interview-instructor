"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ScoreTrendChart } from "@/components/ScoreTrendChart";
import { SkillProgress } from "@/components/SkillProgress";
import type { DashboardData } from "@/lib/types";

type DashboardClientProps = {
  data: DashboardData;
};

export function DashboardClient({ data }: DashboardClientProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
      >
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Dashboard</p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
            Interview progress tracker
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-zinc-400">
            Review your last 20 sessions, track skill growth, and focus the next round
            where it matters most.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-500 px-5 text-sm font-medium text-white"
        >
          Start new interview
        </Link>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-panel space-y-5"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Skill Averages</p>
            <h2 className="mt-2 text-xl font-semibold text-zinc-100">
              Average skill scores
            </h2>
          </div>
          <SkillProgress skills={data.averages} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel space-y-5"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Self Analysis</p>
            <h2 className="mt-2 text-xl font-semibold text-zinc-100">Where you stand</h2>
          </div>
          <div className="rounded-3xl border border-emerald-400/15 bg-emerald-500/[0.06] px-5 py-4 text-sm leading-7 text-zinc-200">
            {data.insight.strongestMessage}
          </div>
          <div className="rounded-3xl border border-amber-400/15 bg-amber-500/[0.06] px-5 py-4 text-sm leading-7 text-zinc-200">
            {data.insight.improvementMessage}
          </div>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-panel space-y-5"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Trend Chart</p>
            <h2 className="mt-2 text-xl font-semibold text-zinc-100">Recent interview scores</h2>
          </div>
          {data.latestScores.length > 0 ? (
            <ScoreTrendChart data={data.latestScores} />
          ) : (
            <p className="text-sm leading-7 text-zinc-400">
              Complete a few interviews to unlock the score trend chart.
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel space-y-5"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Recent Stats</p>
            <h2 className="mt-2 text-xl font-semibold text-zinc-100">Last 20 sessions</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/8 bg-white/[0.03] px-5 py-4">
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Sessions</p>
              <p className="mt-3 text-3xl font-semibold text-zinc-50">{data.interviews.length}</p>
            </div>
            <div className="rounded-3xl border border-white/8 bg-white/[0.03] px-5 py-4">
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Average Score</p>
              <p className="mt-3 text-3xl font-semibold text-zinc-50">
                {data.interviews.length > 0
                  ? (
                      data.interviews.reduce((sum, item) => sum + item.score, 0) /
                      data.interviews.length
                    ).toFixed(1)
                  : "0.0"}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-panel space-y-5"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Interview History</p>
            <h2 className="mt-2 text-xl font-semibold text-zinc-100">Recent evaluations</h2>
          </div>
          <p className="text-sm text-zinc-500">Showing the latest 20 sessions</p>
        </div>

        <div className="grid gap-4">
          {data.interviews.length > 0 ? (
            data.interviews.map((interview) => (
              <div
                key={interview.interviewId ?? `${interview.question}-${interview.score}`}
                className="rounded-3xl border border-white/8 bg-white/[0.03] px-5 py-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.22em] text-zinc-500">
                      <span>{interview.topic}</span>
                      <span>{interview.experience}</span>
                      <span>{interview.difficulty}</span>
                      {interview.cached ? <span className="text-cyan-300">Cached</span> : null}
                    </div>
                    <p className="text-sm leading-7 text-zinc-200">{interview.question}</p>
                    <p className="text-sm text-zinc-400">{interview.followUpQuestion}</p>
                  </div>

                  <div className="min-w-[92px] rounded-2xl border border-white/8 bg-zinc-950/50 px-4 py-3 text-center">
                    <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Score</p>
                    <p className="mt-2 text-2xl font-semibold text-zinc-50">{interview.score}/10</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm leading-7 text-zinc-400">
              No interview history yet. Finish one session and come back here.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

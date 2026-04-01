"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  Layers3,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { ScoreTrendChart } from "@/components/ScoreTrendChart";
import { SkillProgress } from "@/components/SkillProgress";
import type { DashboardData } from "@/lib/types";

type DashboardClientProps = {
  data: DashboardData;
  sessions: Array<{
    sessionId: string;
    topic: string;
    experience: string;
    difficulty: string;
    totalQuestions: number;
    status: string;
    overallScore: number | null;
    createdAt: string;
  }>;
  userName?: string;
};

function formatCreatedAt(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString();
}

export function DashboardClient({ data, sessions, userName = "" }: DashboardClientProps) {
  const completedSessions = sessions.filter((session) => session.overallScore !== null);
  const averageScore =
    completedSessions.length > 0
      ? (
          completedSessions.reduce((sum, item) => sum + (item.overallScore ?? 0), 0) /
          completedSessions.length
        ).toFixed(1)
      : "0.0";

  const recentSessions = sessions.slice(0, 4);
  const latestCompletedSession = completedSessions[0] ?? null;
  const oldestCompletedSession = completedSessions[completedSessions.length - 1] ?? null;
  const trendDelta =
    latestCompletedSession && oldestCompletedSession
      ? (latestCompletedSession.overallScore ?? 0) - (oldestCompletedSession.overallScore ?? 0)
      : 0;
  const trendMessage =
    completedSessions.length === 0
      ? "Complete your first interview to start seeing progress trends."
      : completedSessions.length === 1
        ? `First completed session recorded in ${latestCompletedSession?.topic ?? "your dashboard"}.`
        : trendDelta > 0
          ? `Up ${trendDelta.toFixed(0)} points from your oldest visible completed session.`
          : trendDelta < 0
            ? `Down ${Math.abs(trendDelta).toFixed(0)} points from your oldest visible completed session.`
            : "Holding steady across your recent completed sessions.";
  const improvementMessage =
    completedSessions.length === 0
      ? "Start an interview to generate your first personalized score."
      : `Average score is ${averageScore}/100 across ${completedSessions.length} completed sessions.`;
  const coveredTopics = [...new Set(sessions.map((session) => session.topic).filter(Boolean))];
  const coverageMessage =
    coveredTopics.length > 0
      ? coveredTopics.slice(0, 4).join(", ")
      : "No completed topic coverage yet.";
  const hasSkillData = data.interviews.some((interview) =>
    Object.values(interview.skillBreakdown).some((score) => score > 0),
  );

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface-card overflow-hidden rounded-[2rem]"
      >
        <div className="bg-gradient-balance-card px-6 py-8 text-[var(--color-text-on-dark)] sm:px-8 sm:py-9 lg:px-10">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_420px] xl:items-end">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Logo mode="small" tone="light" ariaLabel="BackendGym dashboard logo" className="h-9 w-9" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Dashboard</p>
              </div>
              <h1 className="max-w-3xl text-type-h1 text-white">A real progress cockpit, not a static score page.</h1>
              <p className="max-w-3xl text-sm leading-7 text-white/78 sm:text-base">
                Review your last 20 sessions, track skill growth, and decide exactly where the next interview round should push harder.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Sessions", `${data.interviews.length}`],
                  ["Average score", averageScore],
                  ["Strongest trend", trendMessage],
                ].map(([label, value], index) => (
                  <div key={label} className={`dashboard-tile rounded-[1.5rem] px-4 py-4 ${index === 2 ? "sm:col-span-3" : ""}`}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/58">{label}</p>
                    <p className={`mt-2 ${index === 2 ? "text-sm leading-6 text-white" : "numeric-tabular text-[2rem] font-semibold text-white"}`}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  label: "Momentum",
                  value: trendMessage,
                  icon: TrendingUp,
                },
                {
                  label: "Next focus",
                  value: improvementMessage,
                  icon: Target,
                },
                {
                  label: "Recent runs",
                  value: `${recentSessions.length} sessions in view`,
                  icon: Clock3,
                },
                {
                  label: "Coverage",
                  value: coverageMessage,
                  icon: Layers3,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="dashboard-tile rounded-[1.5rem] px-4 py-4">
                    <div className="flex items-center gap-2 text-white/78">
                      <Icon className="h-4 w-4 text-[var(--color-accent)]" strokeWidth={2} />
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">{item.label}</p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-white">{item.value}</p>
                  </div>
                );
              })}
              <Link href="/" className="primary-btn w-full sm:col-span-2">
                Start new interview
                <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 bg-[rgba(255,255,255,0.48)] px-6 py-5 sm:grid-cols-2 lg:grid-cols-4 lg:px-10">
          {[
            { title: "Fast read", body: "See your strongest pattern first, then the weak spots that need the next session." },
            { title: "Visual rhythm", body: "Cards, chart, and history now feel like one dashboard instead of separate panels." },
            { title: "Action-first", body: "Primary action stays visible so the dashboard always leads back into practice." },
            { title: "Focused data", body: "Recent sessions and trend views are tightened to improve scanning speed." },
          ].map((item) => (
            <div key={item.title} className="soft-card rounded-[1.3rem] p-4">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{item.body}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="editor-panel space-y-5 p-6 sm:p-7"
        >
          <div>
            <p className="section-kicker">Skill Averages</p>
            <h2 className="mt-2 section-title">Average skill scores</h2>
          </div>
          {hasSkillData ? (
            <SkillProgress skills={data.averages} />
          ) : (
            <p className="text-sm leading-7 text-[var(--color-text-secondary)]">
              Session history is available now. Detailed skill averages are not included in the
              `/dashboard/my-sessions` response yet, so this panel will populate when that data is exposed.
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="editor-panel space-y-5 p-6 sm:p-7"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(20,69,22,0.08)]">
              <Sparkles className="h-5 w-5 text-[var(--color-primary-dark)]" strokeWidth={1.8} />
            </div>
            <div>
              <p className="section-kicker">Self Analysis</p>
              <h2 className="mt-1 section-title">Where you stand</h2>
            </div>
          </div>
          <div className="soft-card rounded-[1.35rem] p-5 text-sm leading-7 text-[var(--color-text-primary)]">
            {trendMessage}
          </div>
          <div className="rounded-[1.35rem] border border-[rgba(229,57,53,0.16)] bg-[var(--color-danger-light)] p-5 text-sm leading-7 text-[var(--color-text-primary)]">
            {improvementMessage}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="soft-card rounded-[1.25rem] p-5">
              <p className="section-kicker">Sessions</p>
              <p className="numeric-tabular mt-3 text-type-h2 text-[var(--color-text-primary)]">{data.interviews.length}</p>
            </div>
            <div className="soft-card rounded-[1.25rem] p-5">
              <p className="section-kicker">Average score</p>
              <p className="numeric-tabular mt-3 text-type-h2 text-[var(--color-text-primary)]">{averageScore}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_420px]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="editor-panel space-y-5 p-6 sm:p-7"
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
          className="editor-panel space-y-5 p-6 sm:p-7"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-kicker">Recent Runs</p>
              <h2 className="mt-2 section-title">Latest session snapshots</h2>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">Last 4</p>
          </div>
          <div className="space-y-3">
            {recentSessions.length > 0 ? (
              recentSessions.map((session) => (
                <div key={session.sessionId} className="soft-card rounded-[1.25rem] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
                        {session.topic}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[var(--color-text-primary)]">
                        {session.experience} / {session.difficulty}
                      </p>
                      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                        {session.status} • {formatCreatedAt(session.createdAt)}
                      </p>
                    </div>
                    <div className="rounded-full bg-[rgba(176,236,112,0.18)] px-3 py-1 text-sm font-semibold text-[var(--color-primary-dark)]">
                      {session.overallScore === null ? "Pending" : `${session.overallScore}/100`}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm leading-7 text-[var(--color-text-secondary)]">
                No sessions yet. Start your first interview to see your history here.
              </p>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="editor-panel space-y-5 p-6 sm:p-7"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">Interview History</p>
            <h2 className="mt-2 section-title">Recent evaluations</h2>
            {userName ? (
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">Welcome back, {userName}</p>
            ) : null}
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">Showing the latest 20 sessions</p>
        </div>

        <div className="grid gap-4">
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <div
                key={session.sessionId}
                className="soft-card rounded-[1.4rem] p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-type-caption uppercase text-[var(--color-text-secondary)]">
                      <span>{session.topic}</span>
                      <span>/</span>
                      <span>{session.experience}</span>
                      <span>/</span>
                      <span>{session.difficulty}</span>
                      <span>/</span>
                      <span>{session.status}</span>
                    </div>
                    <p className="text-sm leading-7 text-[var(--color-text-primary)]">
                      Session ID: {session.sessionId}
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {session.totalQuestions} questions • {formatCreatedAt(session.createdAt)}
                    </p>
                  </div>

                  <div className="min-w-[108px] rounded-[1.2rem] bg-[var(--color-primary-dark)] px-4 py-4 text-center text-[var(--color-text-on-dark)]">
                    <p className="section-kicker !text-white/68">Score</p>
                    <p className="numeric-tabular mt-2 text-type-h3 text-white">
                      {session.overallScore === null ? "Pending" : `${session.overallScore}/100`}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm leading-7 text-[var(--color-text-secondary)]">
              No sessions yet. Start your first interview to see your history here.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

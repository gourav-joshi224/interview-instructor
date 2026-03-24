"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useMemo } from "react";
import { Logo } from "@/components/Logo";
import { LearningResourceCard } from "@/components/LearningResourceCard";
import { getSessionScores, type RetryParams } from "@/lib/local-history";
import type { FinishResponse } from "@/lib/view-types";

type InterviewReportCardProps = {
  report: FinishResponse;
  onRetryWeakAreas?: (params: RetryParams) => void;
};

const stepDownDifficulty = (difficulty: string) => {
  const normalized = difficulty.trim().toLowerCase();

  if (normalized === "incident mode" || normalized === "hard" || normalized === "epic") {
    return "On Call";
  }

  if (normalized === "on call" || normalized === "medium") {
    return "Warm Up";
  }

  return "Warm Up";
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

export function InterviewReportCard({ report, onRetryWeakAreas }: InterviewReportCardProps) {
  const scoreHistory = useMemo(() => getSessionScores(report.topic), [report.topic]);
  const trendPoints = useMemo(() => {
    if (scoreHistory.length < 2) {
      return [];
    }

    const minX = 8;
    const maxX = 112;
    const minY = 4;
    const maxY = 28;
    const step = scoreHistory.length > 1 ? (maxX - minX) / (scoreHistory.length - 1) : 0;

    return scoreHistory.map((entry, index) => ({
      x: Number((minX + step * index).toFixed(2)),
      y: Number((maxY - ((Math.max(0, Math.min(100, entry.score)) / 100) * (maxY - minY))).toFixed(2)),
      score: entry.score,
    }));
  }, [scoreHistory]);
  const trendPath = trendPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const retryParams = useMemo<RetryParams>(() => {
    const weakConcepts = (report.questionResults ?? [])
      .slice()
      .sort((left, right) => left.score - right.score)
      .flatMap((result) => {
        const concept = typeof result.concept === "string" ? result.concept.trim() : "";
        const subtopic = typeof result.subtopic === "string" ? result.subtopic.trim() : "";
        const missingConcepts = Array.isArray(result.feedback.missingConcepts)
          ? result.feedback.missingConcepts
              .filter((item): item is string => typeof item === "string")
              .map((item) => item.trim())
              .filter(Boolean)
          : [];

        return [concept, subtopic, ...missingConcepts].filter(Boolean);
      })
      .filter((item, index, items) => items.findIndex((candidate) => candidate.toLowerCase() === item.toLowerCase()) === index)
      .slice(0, 3);

    return {
      topic: report.topic,
      experience: report.experience,
      difficulty: stepDownDifficulty(report.difficulty),
      totalQuestions: String(Math.min(report.totalQuestions, 5)),
      focusConcepts: weakConcepts,
      sourceWeakAreas: report.report.weakAreas.slice(0, 3),
    };
  }, [report]);
  const retryFocusLabel = retryParams.focusConcepts.length > 0
    ? retryParams.focusConcepts.join(" • ")
    : retryParams.sourceWeakAreas.join(" • ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex w-full flex-col gap-5"
    >
      {scoreHistory.length >= 2 ? (
        <div className="editor-panel space-y-3 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="section-kicker">Score Trend</p>
              <p className="mt-2 text-sm leading-7 text-[var(--color-text-primary)]">
                Last {scoreHistory.length} sessions · {report.topic}
              </p>
            </div>
            <svg
              width="120"
              height="32"
              viewBox="0 0 120 32"
              aria-label={`Score trend for ${report.topic}`}
              className="shrink-0"
            >
              <polyline
                points={trendPath}
                stroke="var(--color-text-secondary)"
                strokeWidth="1"
                fill="none"
              />
              {trendPoints.map((point, index) => {
                const isLastPoint = index === trendPoints.length - 1;

                return (
                  <circle
                    key={`${point.x}-${point.y}-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r={isLastPoint ? 4 : 2.5}
                    fill={isLastPoint ? "var(--color-text-primary)" : "var(--color-text-secondary)"}
                  />
                );
              })}
            </svg>
          </div>
          <p className="text-sm leading-7 text-[var(--color-text-secondary)]">
            {scoreHistory.map((entry) => entry.score).join(" → ")}
          </p>
        </div>
      ) : null}

      <div className="surface-card overflow-hidden rounded-[2rem]">
        <div className="bg-gradient-balance-card px-6 py-8 text-[var(--color-text-on-dark)] sm:px-8 lg:px-10">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Logo mode="small" tone="light" ariaLabel="BackendGym final report logo" className="h-9 w-9" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Interview Report</p>
              </div>
              <h1 className="max-w-3xl text-type-h1 text-white">Final interview analysis with clearer signal and stronger scanability.</h1>
              <p className="max-w-3xl text-sm leading-7 text-white/78">
                Review your overall performance, weak areas, and targeted plan for your next interview round.
              </p>
            </div>

            <div className="dashboard-tile rounded-[1.5rem] px-6 py-5 text-center">
              <p className="section-kicker !text-white/72">Overall Score</p>
              <p className="numeric-tabular mt-3 text-[2.8rem] font-bold leading-none text-white">
                {report.report.overallScore}
                <span className="ml-1 text-lg text-white/70">/100</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 bg-[rgba(255,255,255,0.4)] px-6 py-5 sm:grid-cols-2 lg:grid-cols-4 lg:px-10">
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
          <div>
            <p className="section-kicker">Strengths</p>
            <p className="mt-2 text-sm leading-7 text-[var(--color-text-primary)]">{report.report.strengths.length} key wins captured</p>
          </div>
          <div>
            <p className="section-kicker">Weak Areas</p>
            <p className="mt-2 text-sm leading-7 text-[var(--color-text-primary)]">{report.report.weakAreas.length} improvement tracks identified</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="editor-panel space-y-4 p-6">
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

        <div className="editor-panel space-y-4 p-6">
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
        <div className="editor-panel space-y-4 p-6">
          <p className="section-kicker">Communication Feedback</p>
          <p className="text-sm leading-7 text-[var(--color-text-primary)]">{report.report.communicationFeedback}</p>
        </div>

        <div className="editor-panel space-y-4 p-6">
          <p className="section-kicker">Technical Feedback</p>
          <p className="text-sm leading-7 text-[var(--color-text-primary)]">{report.report.technicalFeedback}</p>
        </div>
      </div>

      <div className="editor-panel space-y-4 p-6">
        <p className="section-kicker">Improvement Plan</p>
        <p className="text-sm leading-7 text-[var(--color-text-primary)]">{report.report.improvementPlan}</p>
      </div>

      {report.questionResults && report.questionResults.length > 0 ? (
        <div className="editor-panel space-y-4 p-6">
          <p className="section-kicker">Question Results</p>
          <div className="space-y-4">
            {report.questionResults.map((result, index) => (
              <div key={`${index}-${result.score}`} className="soft-card space-y-4 rounded-[1.1rem] px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="section-kicker">Question {index + 1}</p>
                    <p className="mt-2 text-sm leading-7 text-[var(--color-text-primary)]">{result.feedback.explanationForUser}</p>
                  </div>
                  <p className="numeric-tabular text-sm font-semibold text-[var(--color-text-primary)]">{result.score}/100</p>
                </div>

                {result.missedCheckpoints && result.missedCheckpoints.length > 0 ? (
                  <div className="space-y-2">
                    <p className="section-kicker">Key points not covered</p>
                    <div className="space-y-2">
                      {result.missedCheckpoints.map((item) => (
                        <div key={item} className="rounded-[1rem] bg-[rgba(255,255,255,0.56)] px-4 py-3 text-sm leading-6 text-[var(--color-text-primary)]">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="editor-panel p-6">
          <ListSection title="Strengths" items={report.report.strengths} />
        </div>
        <div className="editor-panel p-6">
          <div className="space-y-5">
            <ListSection title="Weak Areas" items={report.report.weakAreas} />
            {onRetryWeakAreas ? (
              <div className="rounded-[1.2rem] border border-[rgba(65,105,67,0.12)] bg-[rgba(255,255,255,0.52)] p-4">
                <p className="section-kicker">Focused Retry</p>
                <p className="mt-2 text-sm leading-7 text-[var(--color-text-primary)]">
                  Retry the weakest concepts at {retryParams.difficulty} difficulty.
                  {retryFocusLabel ? ` Focusing on ${retryFocusLabel}.` : ""}
                </p>
                <button
                  type="button"
                  onClick={() => onRetryWeakAreas(retryParams)}
                  className="primary-btn mt-4"
                >
                  Retry weak areas
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="editor-panel p-6">
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

"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Home,
  PenLine,
  Sparkles,
  Timer,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildBackendUrl } from "@/lib/backend";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth-context";
import { authHeaders } from "@/lib/api-client";
import { saveSessionScore } from "@/lib/local-history";
import { LoadingScreen } from "./LoadingScreen";
import type { InterviewFinalReport, InterviewSessionAnswer } from "@/lib/types";

const START_LOADING_MESSAGES = [
  "Preparing interview session...",
  "Generating first question...",
  "Syncing session state...",
];

const NEXT_LOADING_MESSAGES = [
  "Saving your answer...",
  "Generating next question...",
  "Preparing follow-up challenge...",
];

const FINISH_LOADING_MESSAGES = [
  "Finalizing interview...",
  "Analyzing full conversation...",
  "Preparing final report...",
];

const SESSION_EXPIRED_MESSAGE = "Your session expired. Please sign in again.";

const EXPERIENCE_VALUE_MAP: Record<string, string> = {
  Junior: "Junior",
  Mid: "Mid",
  "Mid-Level": "Mid",
  Senior: "Senior",
};

const DIFFICULTY_VALUE_MAP: Record<string, string> = {
  "Warm Up": "Warm Up",
  Medium: "Medium",
  Hard: "Hard",
  Epic: "Epic",
  "On Call": "Medium",
  "Incident Mode": "Hard",
};

const wait = (duration: number) =>
  new Promise((resolve) => window.setTimeout(resolve, duration));

const normalizeExperience = (value: string) => EXPERIENCE_VALUE_MAP[value] ?? value;

const normalizeDifficulty = (value: string) => DIFFICULTY_VALUE_MAP[value] ?? value;

const getSeenQuestionsStorageKey = (topicId: string) =>
  `ig_seen_${topicId.toLowerCase().replace(/ /g, "_")}`;

const QUESTION_ID_SEPARATOR = "::";

const isQuestionId = (value: unknown): value is string =>
  typeof value === "string" &&
  value.includes(QUESTION_ID_SEPARATOR) &&
  value.split(QUESTION_ID_SEPARATOR).length === 2 &&
  value.split(QUESTION_ID_SEPARATOR).every((part) => part.trim().length > 0);

const readSeenQuestionIds = (topicId: string): string[] => {
  try {
    const storedQuestionIds = localStorage.getItem(getSeenQuestionsStorageKey(topicId));
    const parsedQuestionIds = storedQuestionIds ? JSON.parse(storedQuestionIds) : [];

    return Array.isArray(parsedQuestionIds)
      ? parsedQuestionIds.filter(isQuestionId)
      : [];
  } catch {
    return [];
  }
};

const saveSeenQuestionIds = (topicId: string, answers: InterviewSessionAnswer[]) => {
  const seenQuestionsKey = getSeenQuestionsStorageKey(topicId);
  const newQuestionIds = answers
    .map((item) => item.questionId)
    .filter(isQuestionId);

  try {
    const existingQuestionIds = readSeenQuestionIds(topicId);
    const mergedQuestionIds = [...existingQuestionIds, ...newQuestionIds];
    const deduplicatedQuestionIds = mergedQuestionIds.filter(
      (item, index) => mergedQuestionIds.lastIndexOf(item) === index,
    );
    const cappedQuestionIds = deduplicatedQuestionIds.slice(-50);

    localStorage.setItem(seenQuestionsKey, JSON.stringify(cappedQuestionIds));
  } catch {
    // Ignore localStorage persistence failures and continue to the report.
  }
};

async function readApiError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error || fallback;
  } catch {
    return fallback;
  }
}

type StartSessionResponse = {
  sessionId?: string;
  question?: string;
  questionId?: string;
};

type ProgressSessionResponse = {
  ok?: boolean;
  question?: string;
  questionId?: string;
};

type FinishResponse = {
  sessionId: string;
  topic: string;
  experience: string;
  difficulty: string;
  totalQuestions: number;
  answers: InterviewSessionAnswer[];
  status: "completed";
  report: InterviewFinalReport;
};

export function InterviewBox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, getIdToken } = useAuth();
  const topic = searchParams.get("topic") ?? "";
  const experience = searchParams.get("experience") ?? "";
  const difficulty = searchParams.get("difficulty") ?? "";
  const normalizedExperience = normalizeExperience(experience);
  const normalizedDifficulty = normalizeDifficulty(difficulty);
  const mode = searchParams.get("mode") === "resume" ? "resume" : "standard";
  const followUpQuestion = (searchParams.get("followUpQuestion") ?? "").trim();
  const totalQuestionsParam = Number.parseInt(searchParams.get("totalQuestions") ?? "", 10);
  const totalQuestions = Number.isInteger(totalQuestionsParam) && totalQuestionsParam > 0
    ? totalQuestionsParam
    : 5;

  const [sessionId, setSessionId] = useState("");
  const [question, setQuestion] = useState("");
  const [questionId, setQuestionId] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("");
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState<InterviewSessionAnswer[]>([]);
  const [loadingStart, setLoadingStart] = useState(true);
  const [loadingNext, setLoadingNext] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState("");
  const sessionStarted = useRef(false);

  const answerWordCount = useMemo(() => {
    const trimmed = answer.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [answer]);

  const answerPrompts = [
    "Start with the architecture or mental model.",
    "Call out edge cases and failure modes.",
    "Explain tradeoffs before giving the final choice.",
  ];

  const missingSetup = useMemo(
    () => !topic || !experience || !difficulty,
    [difficulty, experience, topic],
  );

  const isFinalQuestion = currentQuestionNumber >= totalQuestions;

  useEffect(() => {
    if (loading) {
      return;
    }

    if (missingSetup) {
      setLoadingStart(false);
      return;
    }

    let active = true;

    const initializeSession = async () => {
      if (sessionStarted.current) return;
      sessionStarted.current = true;

      setLoadingStart(true);
      setError("");

      try {
        const recentQuestionIds = readSeenQuestionIds(topic);

        const startPromise = fetch(buildBackendUrl("/session/start"), {
          method: "POST",
          headers: await authHeaders(getIdToken),
          body: JSON.stringify({
            topic,
            experience: normalizedExperience,
            difficulty: normalizedDifficulty,
            totalQuestions,
            recentQuestionIds,
            userId: user?.uid ?? null,
          }),
        });

        const [startResponse] = await Promise.all([startPromise, wait(1500)]);

        if (!startResponse.ok) {
          if (startResponse.status === 401 || startResponse.status === 403) {
            throw new Error(SESSION_EXPIRED_MESSAGE);
          }
          throw new Error(await readApiError(startResponse, "Unable to start interview session."));
        }

        const data = (await startResponse.json()) as StartSessionResponse;

        if (!active) {
          return;
        }

        const initialQuestion = followUpQuestion || data.question || "";
        const initialQuestionId = data.questionId ?? "";

        if (!data.sessionId || !initialQuestion) {
          throw new Error("Failed to initialize interview session.");
        }

        setSessionId(data.sessionId);
        setQuestion(initialQuestion);
        setQuestionId(initialQuestionId);
        setSelectedSkill("");
      } catch (requestError) {
        if (!active) {
          return;
        }

        const message =
          requestError instanceof Error
            ? requestError.message
            : "Something went wrong while starting the interview.";
        setError(message);
      } finally {
        if (active) {
          setLoadingStart(false);
        }
      }
    };

    void initializeSession();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, experience, difficulty, totalQuestions, loading]);

  const moveToNextQuestion = async () => {
    if (!answer.trim() || !question || !questionId || !sessionId || isFinalQuestion) {
      setError("Answer the current question before moving ahead.");
      return;
    }

    const nextAnswers = [...answers, { questionId, question, answer: answer.trim() }];
    setLoadingNext(true);
    setError("");

    try {
      const [progressResponse] = await Promise.all([
        fetch(buildBackendUrl("/session/progress"), {
          method: "POST",
          headers: await authHeaders(getIdToken),
          body: JSON.stringify({
            sessionId,
            topic,
            experience: normalizedExperience,
            difficulty: normalizedDifficulty,
            totalQuestions,
            answers: nextAnswers,
          }),
        }),
        wait(1200),
      ]);

      if (!progressResponse.ok) {
        if (progressResponse.status === 401 || progressResponse.status === 403) {
          throw new Error(SESSION_EXPIRED_MESSAGE);
        }
        throw new Error(await readApiError(progressResponse, "Unable to save current interview progress."));
      }

      const progressData = (await progressResponse.json()) as ProgressSessionResponse;

      if (!progressData.question || !progressData.questionId) {
        throw new Error("Could not generate the next interview question.");
      }

      setAnswers(nextAnswers);
      setCurrentQuestionNumber((value) => value + 1);
      setQuestion(progressData.question);
      setQuestionId(progressData.questionId);
      setSelectedSkill("");
      setAnswer("");
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Something went wrong while moving to the next question.";
      setError(message);
    } finally {
      setLoadingNext(false);
    }
  };

  const finishInterview = async () => {
    if (!answer.trim() || !question || !questionId || !sessionId) {
      setError("Answer the final question before finishing the interview.");
      return;
    }

    const finalAnswers = [...answers, { questionId, question, answer: answer.trim() }];
    setFinishing(true);
    setError("");

    try {
      const [finishResponse] = await Promise.all([
        fetch(buildBackendUrl("/session/finish"), {
          method: "POST",
          headers: await authHeaders(getIdToken),
          body: JSON.stringify({
            sessionId,
            answers: finalAnswers,
          }),
        }),
        wait(1800),
      ]);

      if (!finishResponse.ok) {
        if (finishResponse.status === 401 || finishResponse.status === 403) {
          throw new Error(SESSION_EXPIRED_MESSAGE);
        }
        throw new Error(await readApiError(finishResponse, "Unable to finish interview right now."));
      }

      const report = (await finishResponse.json()) as FinishResponse;
      saveSeenQuestionIds(topic, report.answers);
      saveSessionScore(topic, {
        date: new Date().toISOString().slice(0, 10),
        score: report.report.overallScore,
        difficulty,
        experience,
      });
      sessionStorage.setItem("latest-interview-report", JSON.stringify(report));
      sessionStorage.removeItem("latest-interview-result");
      router.push("/result");
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Something went wrong while finishing the interview.";
      setError(message);
      setFinishing(false);
    }
  };

  if (loadingStart) {
    return (
      <LoadingScreen
        title="Starting Interview"
        messages={START_LOADING_MESSAGES}
        subtitle="Setting up your interview session and generating the first question."
      />
    );
  }

  if (loadingNext) {
    return (
      <LoadingScreen
        title="Next Question"
        messages={NEXT_LOADING_MESSAGES}
        subtitle="Saving your response and preparing the next challenge."
      />
    );
  }

  if (finishing) {
    return (
      <LoadingScreen
        title="Final Analysis"
        messages={FINISH_LOADING_MESSAGES}
        subtitle="Analyzing your full interview conversation for final report generation."
      />
    );
  }

  if (missingSetup) {
    return (
      <div className="editor-panel mx-auto max-w-3xl space-y-4 p-8 text-center">
        <p className="section-kicker">Missing setup</p>
        <h1 className="text-type-h2 text-[var(--color-text-primary)]">Start from the setup screen first.</h1>
        <p className="text-sm leading-7 text-[var(--color-text-secondary)]">
          Topic, experience, and heat mode are required to start the interview session.
        </p>
        <div className="pt-2">
          <Link href="/" className="primary-btn">
            Back to setup
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface-card overflow-hidden rounded-[2rem]"
      >
        <div className="bg-gradient-balance-card px-6 py-7 text-[var(--color-text-on-dark)] sm:px-8 lg:px-10">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_360px] xl:items-end">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <Logo mode="small" tone="light" ariaLabel="BackendGym interview logo" className="h-9 w-9" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
                  Active Interview Session
                </p>
                <div className="dashboard-tile inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/78">
                  <Timer className="h-3.5 w-3.5 text-[var(--color-accent)]" strokeWidth={2.2} />
                  Question {currentQuestionNumber} of {totalQuestions}
                </div>
              </div>
              <h1 className="max-w-4xl text-type-h1 text-white">
                Stay in flow and answer like you are whiteboarding a production decision live.
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-white/76 sm:text-base">
                The prompt, progress, and answer tools now live in one workspace so you can think, structure, and submit without fighting the layout.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {[
                ["Topic", topic],
                ["Experience", experience],
                ["Mode", mode === "resume" ? "Resume mode" : "Standard mode"],
                ["Pressure", difficulty],
              ].map(([label, value]) => (
                <div key={label} className="dashboard-tile rounded-[1.4rem] px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/58">{label}</p>
                  <p className="mt-2 text-sm font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 bg-[rgba(255,255,255,0.42)] px-6 py-4 sm:px-8 lg:px-10">
          <div className="flex flex-wrap gap-2 text-type-caption uppercase text-[var(--color-text-secondary)]">
            <span>{topic}</span>
            <span>/</span>
            <span>{experience}</span>
            <span>/</span>
            <span>{mode === "resume" ? "Resume" : "Standard"}</span>
            <span>/</span>
            <span>#{currentQuestionNumber} of {totalQuestions}</span>
          </div>
          <Link
            href="/"
            aria-label="Go to home"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-white/70 px-4 text-sm font-semibold text-[var(--color-primary-dark)] transition hover:bg-white"
          >
            <Home className="h-4 w-4" strokeWidth={1.8} />
            Exit session
          </Link>
        </div>
      </motion.section>

      <div className="grid gap-5 2xl:grid-cols-[minmax(340px,0.32fr)_minmax(0,0.68fr)]">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="editor-panel space-y-5 p-6 sm:p-7"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.15rem] bg-[rgba(20,69,22,0.08)] text-[var(--color-primary-dark)]">
              <ClipboardList className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <p className="section-kicker">Current Interview Question</p>
              <h2 className="mt-1 text-type-h3 text-[var(--color-text-primary)]">Prompt and framing</h2>
            </div>
          </div>
          <div className="rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(20,69,22,0.06)_0%,rgba(176,236,112,0.1)_100%)] p-5">
            <p className="text-lg font-semibold leading-8 text-[var(--color-text-primary)]">
              {question || "No question available."}
            </p>
            {selectedSkill ? (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[rgba(176,236,112,0.22)] px-4 py-2 text-sm font-medium text-[var(--color-primary-dark)]">
                <Sparkles className="h-4 w-4" strokeWidth={1.8} />
                Skill focus: {selectedSkill}
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Answer depth", "Show system tradeoffs, not just the final choice."],
              ["Signal quality", "Mention constraints, bottlenecks, and failure paths."],
              ["Delivery", "Keep the explanation structured enough to sound confident."],
            ].map(([title, body]) => (
              <div key={title} className="soft-card rounded-[1.25rem] p-4">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{body}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="editor-panel space-y-5 p-6 sm:p-7"
        >
          <div>
            <p className="section-kicker">Your Answer</p>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              Explain your reasoning clearly, including tradeoffs and edge cases.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {answerPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() =>
                  setAnswer((current) =>
                    current.trim() ? `${current.trim()}\n\n${prompt}` : `${prompt}\n`,
                  )
                }
                className="inline-flex min-h-11 items-center rounded-full border border-[rgba(65,105,67,0.14)] bg-white px-4 text-sm font-medium text-[var(--color-primary-dark)] transition hover:-translate-y-0.5 hover:border-[rgba(65,105,67,0.28)]"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="rounded-[1.6rem] border border-[rgba(65,105,67,0.12)] bg-[rgba(255,255,255,0.72)] p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-[1.2rem] bg-[rgba(20,69,22,0.05)] px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-primary-dark)]">
                  <PenLine className="h-4 w-4" strokeWidth={2} />
                Answer workspace
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
                <span>{answerWordCount} words</span>
                <span>/</span>
                <span>{answer.trim() ? "Draft in progress" : "Start drafting"}</span>
              </div>
            </div>

            <textarea
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="Walk through your approach for this question..."
              className="interactive-field min-h-[420px] resize-none border-0 bg-transparent px-4 py-3 text-base leading-7 shadow-none focus:translate-y-0 focus:border-0 focus:bg-transparent focus:shadow-none"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "State the approach", icon: CheckCircle2 },
              { label: "Cover constraints", icon: Sparkles },
              { label: "Close with tradeoffs", icon: ArrowRight },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="soft-card flex items-center gap-3 rounded-[1.25rem] p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(176,236,112,0.18)] text-[var(--color-primary-dark)]">
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{item.label}</p>
                </div>
              );
            })}
          </div>

          {error ? <p className="text-sm font-medium text-[var(--color-danger)]">{error}</p> : null}

          <div className="flex flex-col gap-3 border-t border-[rgba(65,105,67,0.12)] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/"
              className="text-sm font-medium text-[var(--color-primary)] transition hover:text-[var(--color-primary-dark)]"
            >
              Reset session
            </Link>
            <div className="flex flex-col gap-3 sm:flex-row">
              {!isFinalQuestion ? (
                <button
                  type="button"
                  onClick={() => {
                    void moveToNextQuestion();
                  }}
                  disabled={!answer.trim()}
                  className="primary-btn disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next Question
                  <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
                </button>
              ) : null}

              {isFinalQuestion ? (
                <button
                  type="button"
                  onClick={() => {
                    void finishInterview();
                  }}
                  disabled={!answer.trim()}
                  className="primary-btn disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Finish Interview
                  <CheckCircle2 className="h-4 w-4" strokeWidth={1.8} />
                </button>
              ) : null}
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

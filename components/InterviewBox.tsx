"use client";

import { motion } from "framer-motion";
import { Home, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/Logo";
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

const wait = (duration: number) =>
  new Promise((resolve) => window.setTimeout(resolve, duration));

async function readApiError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error || fallback;
  } catch {
    return fallback;
  }
}

type QuestionResponse = {
  question?: string;
  questionId?: string;
  skill?: string | null;
};

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
  const topic = searchParams.get("topic") ?? "";
  const experience = searchParams.get("experience") ?? "";
  const difficulty = searchParams.get("difficulty") ?? "";
  const mode = searchParams.get("mode") === "resume" ? "resume" : "standard";
  const followUpQuestion = (searchParams.get("followUpQuestion") ?? "").trim();
  const totalQuestionsParam = Number(searchParams.get("totalQuestions") ?? "5");
  const totalQuestions = [5, 10, 15].includes(totalQuestionsParam) ? totalQuestionsParam : 5;

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

  const missingSetup = useMemo(
    () => !topic || !experience || !difficulty,
    [difficulty, experience, topic],
  );

  const isFinalQuestion = currentQuestionNumber >= totalQuestions;

  useEffect(() => {
    if (missingSetup) {
      setLoadingStart(false);
      return;
    }

    let active = true;

    const initializeSession = async () => {
      setLoadingStart(true);
      setError("");

      try {
        const startPromise = fetch("/api/session/start", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic,
            experience,
            difficulty,
            totalQuestions,
          }),
        });

        const [startResponse] = await Promise.all([startPromise, wait(1500)]);

        if (!startResponse.ok) {
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
  }, [
    difficulty,
    experience,
    followUpQuestion,
    missingSetup,
    topic,
    totalQuestions,
  ]);

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
        fetch("/api/session/progress", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            topic,
            experience,
            difficulty,
            totalQuestions,
            answers: nextAnswers,
          }),
        }),
        wait(1200),
      ]);

      if (!progressResponse.ok) {
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
        fetch("/api/session/finish", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            answers: finalAnswers,
          }),
        }),
        wait(1800),
      ]);

      if (!finishResponse.ok) {
        throw new Error(await readApiError(finishResponse, "Unable to finish interview right now."));
      }

      const report = (await finishResponse.json()) as FinishResponse;
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
      <div className="surface-card mx-auto max-w-2xl space-y-4 p-8 text-center">
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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface-card overflow-hidden"
      >
        <div className="bg-gradient-balance-card px-6 py-7 text-[var(--color-text-on-dark)] sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Logo mode="small" tone="light" ariaLabel="BackendGym interview logo" className="h-9 w-9" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
                  Active Interview Session
                </p>
              </div>
              <h1 className="text-type-h1 text-white">
                Question {currentQuestionNumber} / {totalQuestions}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-type-caption uppercase text-white/72">
              <span>{topic}</span>
              <span>/</span>
              <span>{experience}</span>
              <span>/</span>
              <span>{difficulty}</span>
              <span>/</span>
              <span>{mode === "resume" ? "Resume mode" : "Standard mode"}</span>
              <Link
                href="/"
                aria-label="Go to home"
                className="ml-0 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-white/16 sm:ml-2"
              >
                <Home className="h-4 w-4" strokeWidth={1.8} />
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-[rgba(255,255,255,0.4)] px-6 py-4 sm:px-8">
          <div className="flex flex-wrap gap-2 text-type-caption uppercase text-[var(--color-text-secondary)]">
            <span>{topic}</span>
            <span>/</span>
            <span>{experience}</span>
            <span>/</span>
            <span>{mode === "resume" ? "Resume" : "Standard"}</span>
            <span>/</span>
            <span>#{currentQuestionNumber} of {totalQuestions}</span>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="surface-card space-y-4 p-6 sm:p-8"
      >
        <p className="section-kicker">Current Interview Question</p>
        <p className="max-w-5xl text-type-h3 text-[var(--color-text-primary)]">
          {question || "No question available."}
        </p>
        {selectedSkill ? (
          <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(176,236,112,0.22)] px-4 py-2 text-sm font-medium text-[var(--color-primary-dark)]">
            <Sparkles className="h-4 w-4" strokeWidth={1.8} />
            Skill focus: {selectedSkill}
          </div>
        ) : null}
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="surface-card space-y-4 p-6 sm:p-8"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="section-kicker">Your Answer</p>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Explain your reasoning clearly, including tradeoffs and edge cases.
            </p>
          </div>
          <Link href="/" className="text-sm font-medium text-[var(--color-primary)] transition hover:text-[var(--color-primary-dark)]">
            Reset
          </Link>
        </div>

        <textarea
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder="Walk through your approach for this question..."
          className="min-h-[260px] w-full rounded-[1rem] border-2 border-transparent bg-[var(--color-surface-light)] px-5 py-4 text-base leading-7 text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-accent)] focus:bg-white"
        />

        {error ? <p className="text-sm font-medium text-[var(--color-danger)]">{error}</p> : null}

        <div className="flex justify-end gap-3">
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
            </button>
          ) : null}
        </div>
      </motion.section>
    </div>
  );
}

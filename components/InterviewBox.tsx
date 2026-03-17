"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  skill?: string | null;
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

  const requestQuestion = useCallback(async () => {
    const response = await fetch("/api/question", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic,
        experience,
        difficulty,
        mode,
        resumeDataUrl:
          mode === "resume" ? sessionStorage.getItem("interview-resume-data-url") : undefined,
      }),
    });

    if (!response.ok) {
      throw new Error(
        await readApiError(response, "Unable to generate the next interview question."),
      );
    }

    const data = (await response.json()) as QuestionResponse;
    return {
      question: data.question ?? "",
      skill: data.skill ?? "",
    };
  }, [difficulty, experience, mode, topic]);

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

        const [startResponse, firstQuestion] = followUpQuestion
          ? await Promise.all([startPromise, Promise.resolve({ question: followUpQuestion, skill: "" }), wait(1000)])
          : await Promise.all([startPromise, requestQuestion(), wait(1500)]);

        if (!startResponse.ok) {
          throw new Error(
            await readApiError(startResponse, "Unable to start interview session."),
          );
        }

        const data = (await startResponse.json()) as { sessionId?: string };

        if (!active) {
          return;
        }

        if (!data.sessionId || !firstQuestion.question) {
          throw new Error("Failed to initialize interview session.");
        }

        setSessionId(data.sessionId);
        setQuestion(firstQuestion.question);
        setSelectedSkill(firstQuestion.skill);
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
    mode,
    requestQuestion,
    topic,
    totalQuestions,
  ]);

  const moveToNextQuestion = async () => {
    if (!answer.trim() || !question || !sessionId || isFinalQuestion) {
      setError("Answer the current question before moving ahead.");
      return;
    }

    const nextAnswers = [...answers, { question, answer: answer.trim() }];
    setLoadingNext(true);
    setError("");

    try {
      const [progressResponse, nextQuestion] = await Promise.all([
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
        requestQuestion(),
        wait(1200),
      ]);

      if (!progressResponse.ok) {
        throw new Error(
          await readApiError(progressResponse, "Unable to save current interview progress."),
        );
      }

      if (!nextQuestion.question) {
        throw new Error("Could not generate the next interview question.");
      }

      setAnswers(nextAnswers);
      setCurrentQuestionNumber((value) => value + 1);
      setQuestion(nextQuestion.question);
      setSelectedSkill(nextQuestion.skill);
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
    if (!answer.trim() || !question || !sessionId) {
      setError("Answer the final question before finishing the interview.");
      return;
    }

    const finalAnswers = [...answers, { question, answer: answer.trim() }];
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
        throw new Error(
          await readApiError(finishResponse, "Unable to finish interview right now."),
        );
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
      <div className="glass-panel mx-auto max-w-2xl space-y-4 text-center">
        <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">
          Missing setup
        </p>
        <h1 className="text-2xl font-semibold text-zinc-50">
          Start from the setup screen first.
        </h1>
        <p className="text-sm leading-7 text-zinc-400">
          Topic, experience, and heat mode are required to start the interview session.
        </p>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-500 px-5 text-sm font-medium text-white"
        >
          Back to setup
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between"
      >
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
            Active Interview Session
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
            Question {currentQuestionNumber} / {totalQuestions}
          </h1>
        </div>

        <div className="glass-panel flex flex-wrap gap-3 text-sm text-zinc-300">
          <span>{topic}</span>
          <span className="text-zinc-600">/</span>
          <span>{experience}</span>
          <span className="text-zinc-600">/</span>
          <span>{difficulty}</span>
          <span className="text-zinc-600">/</span>
          <span>{mode === "resume" ? "Resume mode" : "Standard mode"}</span>
          <Link
            href="/"
            aria-label="Go to home"
            className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/12 bg-white/[0.03] text-zinc-300 transition hover:border-blue-400/40 hover:text-blue-300"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 10.5 12 3l9 7.5" />
              <path d="M5 9.5V21h14V9.5" />
            </svg>
          </Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-panel space-y-4"
      >
        <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
          Current Interview Question
        </p>
        <p className="text-xl leading-8 text-zinc-100">
          {question || "No question available."}
        </p>
        {selectedSkill ? (
          <p className="text-sm text-cyan-300">Skill focus: {selectedSkill}</p>
        ) : null}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel space-y-4"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
              Your Answer
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              Explain your reasoning clearly, including tradeoffs and edge cases.
            </p>
          </div>
          <Link href="/" className="text-sm text-zinc-400 transition hover:text-zinc-200">
            Reset
          </Link>
        </div>

        <textarea
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder="Walk through your approach for this question..."
          className="min-h-[220px] w-full rounded-3xl border border-white/10 bg-zinc-950/80 px-5 py-4 text-base text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-blue-400/50"
        />

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <div className="flex justify-end gap-3">
          {!isFinalQuestion ? (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => {
                void moveToNextQuestion();
              }}
              disabled={!answer.trim()}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-blue-500 px-6 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
            >
              Next Question
            </motion.button>
          ) : null}

          {isFinalQuestion ? (
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => {
                void finishInterview();
              }}
              disabled={!answer.trim()}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-emerald-500 px-6 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
            >
              Finish Interview
            </motion.button>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}

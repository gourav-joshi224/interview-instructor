"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LoadingScreen } from "./LoadingScreen";
import type { StoredInterviewResult } from "@/lib/types";

const QUESTION_LOADING_MESSAGES = [
  "Preparing interview...",
  "Selecting question...",
  "Consulting senior engineers...",
];

const EVALUATION_LOADING_MESSAGES = [
  "Analyzing answer...",
  "Evaluating technical accuracy...",
  "Checking missing concepts...",
  "Preparing feedback...",
];

type EvaluateResponse = Omit<
  StoredInterviewResult,
  "topic" | "experience" | "difficulty" | "question" | "answer"
>;

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

export function InterviewBox() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topic = searchParams.get("topic") ?? "";
  const experience = searchParams.get("experience") ?? "";
  const difficulty = searchParams.get("difficulty") ?? "";

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState("");

  const missingSetup = useMemo(
    () => !topic || !experience || !difficulty,
    [difficulty, experience, topic],
  );

  useEffect(() => {
    if (missingSetup) {
      setLoadingQuestion(false);
      return;
    }

    let active = true;

    const createQuestion = async () => {
      setLoadingQuestion(true);
      setError("");

      try {
        const [response] = await Promise.all([
          fetch("/api/question", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              topic,
              experience,
              difficulty,
            }),
          }),
          wait(2400),
        ]);

        if (!response.ok) {
          throw new Error(
            await readApiError(
              response,
              "Unable to prepare an interview question right now.",
            ),
          );
        }

        const data = (await response.json()) as { question?: string; error?: string };

        if (!active) {
          return;
        }

        setQuestion(data.question ?? "");
      } catch (requestError) {
        if (!active) {
          return;
        }

        const message =
          requestError instanceof Error
            ? requestError.message
            : "Something went wrong while generating the interview question.";
        setError(message);
      } finally {
        if (active) {
          setLoadingQuestion(false);
        }
      }
    };

    void createQuestion();

    return () => {
      active = false;
    };
  }, [difficulty, experience, missingSetup, topic]);

  const submitAnswer = async () => {
    if (!question || !answer.trim()) {
      setError("Add your answer before asking for an evaluation.");
      return;
    }

    setEvaluating(true);
    setError("");

    try {
      const [response] = await Promise.all([
        fetch("/api/evaluate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic,
            experience,
            difficulty,
            question,
            answer,
          }),
        }),
        wait(2600),
      ]);

      if (!response.ok) {
        throw new Error(
          await readApiError(response, "Unable to evaluate the answer right now."),
        );
      }

      const data = (await response.json()) as EvaluateResponse;
      const result: StoredInterviewResult = {
        topic,
        experience,
        difficulty,
        question,
        answer,
        ...data,
      };

      sessionStorage.setItem("latest-interview-result", JSON.stringify(result));
      router.push("/result");
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Something went wrong while evaluating the answer.";
      setError(message);
      setEvaluating(false);
    }
  };

  if (loadingQuestion) {
    return (
      <LoadingScreen
        title="Starting Interview"
        messages={QUESTION_LOADING_MESSAGES}
        subtitle="We are tailoring a backend question to your selected topic, experience level, and heat mode."
      />
    );
  }

  if (evaluating) {
    return (
      <LoadingScreen
        title="Evaluating Answer"
        messages={EVALUATION_LOADING_MESSAGES}
        subtitle="Your answer is being reviewed for technical depth, clarity, and the concepts you may want to strengthen."
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
          Topic, experience, and heat mode are required to generate the interview.
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
            Active Interview
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
            Backend practice session
          </h1>
        </div>

        <div className="glass-panel flex flex-wrap gap-3 text-sm text-zinc-300">
          <span>{topic}</span>
          <span className="text-zinc-600">/</span>
          <span>{experience}</span>
          <span className="text-zinc-600">/</span>
          <span>{difficulty}</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-panel space-y-4"
      >
        <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
          Interview Question
        </p>
        <p className="text-xl leading-8 text-zinc-100">
          {question || "No question available."}
        </p>
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
          placeholder="Walk through your design or debugging thought process here..."
          className="min-h-[220px] w-full rounded-3xl border border-white/10 bg-zinc-950/80 px-5 py-4 text-base text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-blue-400/50"
        />

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <div className="flex justify-end">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.985 }}
            onClick={submitAnswer}
            disabled={!answer.trim()}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-blue-500 px-6 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
          >
            Submit Answer
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

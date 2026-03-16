"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EvaluationCard } from "@/components/EvaluationCard";
import type { StoredInterviewResult } from "@/lib/types";

export default function ResultPage() {
  const [result, setResult] = useState<StoredInterviewResult | null>(null);

  useEffect(() => {
    try {
      const storedResult = sessionStorage.getItem("latest-interview-result");

      if (!storedResult) {
        return;
      }

      setResult(JSON.parse(storedResult) as StoredInterviewResult);
    } catch {
      sessionStorage.removeItem("latest-interview-result");
    }
  }, []);

  return (
    <main className="page-shell px-6 py-10 sm:px-8 lg:px-12">
      {result ? (
        <EvaluationCard result={result} />
      ) : (
        <div className="glass-panel mx-auto max-w-2xl space-y-4 text-center">
          <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">
            No result found
          </p>
          <h1 className="text-2xl font-semibold text-zinc-50">
            Complete an interview round to see the evaluation.
          </h1>
          <p className="text-sm leading-7 text-zinc-400">
            The result screen reads the latest session from local storage after the
            API evaluation finishes.
          </p>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-500 px-5 text-sm font-medium text-white"
          >
            Back to setup
          </Link>
        </div>
      )}
    </main>
  );
}

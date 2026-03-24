"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EvaluationCard } from "@/components/EvaluationCard";
import { FullWidthSection } from "@/components/FullWidthSection";
import { InterviewReportCard } from "@/components/InterviewReportCard";
import type { RetryParams } from "@/lib/local-history";
import type { StoredInterviewResult } from "@/lib/types";
import type { FinishResponse } from "@/lib/view-types";

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<StoredInterviewResult | null>(null);
  const [report, setReport] = useState<FinishResponse | null>(null);

  useEffect(() => {
    try {
      const storedReport = sessionStorage.getItem("latest-interview-report");
      if (storedReport) {
        setReport(JSON.parse(storedReport) as FinishResponse);
        return;
      }

      const storedResult = sessionStorage.getItem("latest-interview-result");

      if (!storedResult) {
        return;
      }

      setResult(JSON.parse(storedResult) as StoredInterviewResult);
    } catch {
      sessionStorage.removeItem("latest-interview-result");
    }
  }, []);

  const handleRetryWeakAreas = (params: RetryParams) => {
    const nextParams = new URLSearchParams({
      retryTopic: params.topic,
      retryExperience: params.experience,
      retryDifficulty: params.difficulty,
      retryTotalQuestions: params.totalQuestions,
    });

    if (params.focusConcepts.length > 0) {
      nextParams.set("retryConcepts", params.focusConcepts.join(","));
    }

    if (params.sourceWeakAreas.length > 0) {
      nextParams.set("retryWeakAreas", params.sourceWeakAreas.join(","));
    }

    router.push(`/?${nextParams.toString()}#setup`);
  };

  return (
    <FullWidthSection
      className="page-shell"
      contentClassName="full-app-shell py-4 sm:py-5"
      fullBleed
    >
      {report ? (
        <InterviewReportCard report={report} onRetryWeakAreas={handleRetryWeakAreas} />
      ) : result ? (
        <EvaluationCard result={result} />
      ) : (
        <div className="surface-card mx-auto max-w-2xl space-y-4 p-8 text-center">
          <p className="section-kicker">No result found</p>
          <h1 className="text-type-h2 text-[var(--color-text-primary)]">
            Complete an interview round to see the evaluation.
          </h1>
          <p className="text-sm leading-7 text-[var(--color-text-secondary)]">
            The result screen reads the latest session from local storage after the
            API evaluation finishes.
          </p>
          <div className="pt-2">
            <Link href="/" className="primary-btn">
              Back to setup
            </Link>
          </div>
        </div>
      )}
    </FullWidthSection>
  );
}

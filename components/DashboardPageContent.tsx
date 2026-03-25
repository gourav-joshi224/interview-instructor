"use client";

import { useEffect, useState } from "react";
import { DashboardClient } from "@/components/DashboardClient";
import { LoadingScreen } from "@/components/LoadingScreen";
import { buildBackendUrl } from "@/lib/backend";
import { buildDashboardData } from "@/lib/dashboard";
import type { StoredInterviewResult } from "@/lib/types";

export function DashboardPageContent() {
  const [interviews, setInterviews] = useState<StoredInterviewResult[] | null>(null);

  useEffect(() => {
    let active = true;

    const loadInterviews = async () => {
      try {
        const response = await fetch(buildBackendUrl("/dashboard/interviews?limit=20"), {
          method: "GET",
        });

        const payload = response.ok
          ? (((await response.json()) as StoredInterviewResult[]) ?? [])
          : [];

        if (active) {
          setInterviews(payload);
        }
      } catch {
        if (active) {
          setInterviews([]);
        }
      }
    };

    void loadInterviews();

    return () => {
      active = false;
    };
  }, []);

  if (interviews === null) {
    return (
      <LoadingScreen
        title="Loading Dashboard"
        messages={[
          "Fetching your recent interviews...",
          "Calculating score trends...",
          "Preparing your progress cockpit...",
        ]}
        subtitle="Loading your saved sessions from the backend."
      />
    );
  }

  if (interviews.length === 0) {
    return (
      <LoadingScreen
        title="Dashboard Ready"
        messages={[
          "No saved sessions yet",
          "Your progress tracker will appear here",
          "Complete an interview to populate the dashboard",
        ]}
        subtitle="We will show skill averages, score trends, and study guidance once interview history is available."
      />
    );
  }

  return <DashboardClient data={buildDashboardData(interviews)} />;
}

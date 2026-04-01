"use client";

import { useEffect, useState } from "react";
import { DashboardClient } from "@/components/DashboardClient";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useAuth } from "@/lib/auth-context";
import { authHeaders } from "@/lib/api-client";
import { buildBackendUrl } from "@/lib/backend";
import { buildDashboardData } from "@/lib/dashboard";
import type { StoredInterviewResult } from "@/lib/types";

type DashboardSession = {
  sessionId: string;
  topic: string;
  experience: string;
  difficulty: string;
  totalQuestions: number;
  status: string;
  overallScore: number | null;
  createdAt: string;
};

const EMPTY_SKILL_BREAKDOWN = {
  architecture: 0,
  scalability: 0,
  dataModeling: 0,
  caching: 0,
} as const;

function mapSessionsToStoredInterviews(sessions: DashboardSession[]): StoredInterviewResult[] {
  return sessions.map((session) => ({
    interviewId: session.sessionId,
    topic: session.topic,
    experience: session.experience,
    difficulty: session.difficulty,
    totalQuestions: session.totalQuestions,
    score: session.overallScore === null ? 0 : Math.round(session.overallScore) / 10,
    strengths: [],
    missingConcepts: [],
    explanationForUser: "",
    idealAnswer: "",
    followUpQuestion: "",
    skillBreakdown: { ...EMPTY_SKILL_BREAKDOWN },
    learningResources: [],
    question: `Session ${session.sessionId}`,
    answer: "",
  }));
}

export function DashboardPageContent() {
  const { user, getIdToken } = useAuth();
  const [sessions, setSessions] = useState<DashboardSession[] | null>(null);

  useEffect(() => {
    let active = true;

    const loadSessions = async () => {
      try {
        const response = await fetch(buildBackendUrl("/dashboard/my-sessions?limit=20"), {
          method: "GET",
          headers: await authHeaders(getIdToken),
        });

        const payload = response.ok
          ? (((await response.json()) as DashboardSession[]) ?? [])
          : [];

        if (active) {
          setSessions(payload);
        }
      } catch {
        if (active) {
          setSessions([]);
        }
      }
    };

    void loadSessions();

    return () => {
      active = false;
    };
  }, [getIdToken]);

  if (sessions === null) {
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

  return (
    <DashboardClient
      data={buildDashboardData(mapSessionsToStoredInterviews(sessions))}
      sessions={sessions}
      userName={user?.name ?? ""}
    />
  );
}

import { FullWidthSection } from "@/components/FullWidthSection";
import { DashboardClient } from "@/components/DashboardClient";
import { LoadingScreen } from "@/components/LoadingScreen";
import { buildDashboardData } from "@/lib/dashboard";
import type { StoredInterviewResult } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const backendUrl = process.env.BACKEND_API_URL ?? "http://127.0.0.1:3001";
  const response = await fetch(`${backendUrl}/dashboard/interviews?limit=20`, {
    method: "GET",
    cache: "no-store",
  });
  const interviews = response.ok
    ? (((await response.json()) as StoredInterviewResult[]) ?? [])
    : [];
  const data = buildDashboardData(interviews);

  return (
    <FullWidthSection className="page-shell py-[var(--space-2xl)] sm:py-[var(--space-3xl)]" contentClassName="space-y-6">
      {interviews.length > 0 ? (
        <DashboardClient data={data} />
      ) : (
        <LoadingScreen
          title="Dashboard Ready"
          messages={[
            "No saved sessions yet",
            "Your progress tracker will appear here",
            "Complete an interview to populate the dashboard",
          ]}
          subtitle="We will show skill averages, score trends, and study guidance once interview history is available."
        />
      )}
    </FullWidthSection>
  );
}

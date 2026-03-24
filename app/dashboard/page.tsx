import { FullWidthSection } from "@/components/FullWidthSection";
import { DashboardClient } from "@/components/DashboardClient";
import { LoadingScreen } from "@/components/LoadingScreen";
import { buildDashboardData } from "@/lib/dashboard";
import type { StoredInterviewResult } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const backendUrl = process.env.BACKEND_API_URL ?? "http://127.0.0.1:3001";
  let interviews: StoredInterviewResult[] = [];

  try {
    const response = await fetch(`${backendUrl}/dashboard/interviews?limit=20`, {
      method: "GET",
      cache: "no-store",
    });

    interviews = response.ok
      ? (((await response.json()) as StoredInterviewResult[]) ?? [])
      : [];
  } catch {
    interviews = [];
  }

  const data = buildDashboardData(interviews);

  return (
    <FullWidthSection
      className="page-shell"
      contentClassName="full-app-shell py-4 sm:py-5"
      fullBleed
    >
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

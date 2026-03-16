import { DashboardClient } from "@/components/DashboardClient";
import { LoadingScreen } from "@/components/LoadingScreen";
import { buildDashboardData } from "@/lib/dashboard";
import { getRecentInterviews } from "@/lib/firebase";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const interviews = await getRecentInterviews(20);
  const data = buildDashboardData(interviews);

  return (
    <main className="page-shell px-6 py-10 sm:px-8 lg:px-12">
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
    </main>
  );
}

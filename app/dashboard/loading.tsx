import { LoadingScreen } from "@/components/LoadingScreen";

export default function DashboardLoading() {
  return (
    <main className="page-shell px-6 py-10 sm:px-8 lg:px-12">
      <LoadingScreen
        title="Loading Dashboard"
        messages={[
          "Collecting interview history...",
          "Calculating skill averages...",
          "Plotting your score trend...",
        ]}
        subtitle="We are preparing your recent progress, strengths, and study direction."
      />
    </main>
  );
}

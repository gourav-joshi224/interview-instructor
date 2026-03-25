import { FullWidthSection } from "@/components/FullWidthSection";
import { DashboardPageContent } from "@/components/DashboardPageContent";

export default function DashboardPage() {
  return (
    <FullWidthSection
      className="page-shell"
      contentClassName="full-app-shell py-4 sm:py-5"
      fullBleed
    >
      <DashboardPageContent />
    </FullWidthSection>
  );
}

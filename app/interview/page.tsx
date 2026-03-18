import { FullWidthSection } from "@/components/FullWidthSection";
import { Suspense } from "react";
import { InterviewBox } from "@/components/InterviewBox";
import { LoadingScreen } from "@/components/LoadingScreen";

export const dynamic = "force-dynamic";

export default function InterviewPage() {
  return (
    <FullWidthSection className="page-shell py-[var(--space-2xl)] sm:py-[var(--space-3xl)]" contentClassName="space-y-6">
      <Suspense
        fallback={
          <LoadingScreen
            title="Starting Interview"
            messages={[
              "Preparing interview...",
              "Selecting question...",
              "Consulting senior engineers...",
            ]}
          />
        }
      >
        <InterviewBox />
      </Suspense>
    </FullWidthSection>
  );
}

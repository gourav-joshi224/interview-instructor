import { FullWidthSection } from "@/components/FullWidthSection";
import { Suspense } from "react";
import { InterviewBox } from "@/components/InterviewBox";
import { LoadingScreen } from "@/components/LoadingScreen";

export default function InterviewPage() {
  return (
    <FullWidthSection
      className="page-shell"
      contentClassName="full-app-shell py-4 sm:py-5"
      fullBleed
    >
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

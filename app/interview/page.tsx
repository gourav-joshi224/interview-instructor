import { Suspense } from "react";
import { InterviewBox } from "@/components/InterviewBox";
import { LoadingScreen } from "@/components/LoadingScreen";

export const dynamic = "force-dynamic";

export default function InterviewPage() {
  return (
    <main className="page-shell px-6 py-10 sm:px-8 lg:px-12">
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
    </main>
  );
}

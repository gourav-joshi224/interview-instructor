import { FullWidthSection } from "@/components/FullWidthSection";
import { HeroFullScreen } from "@/components/HeroFullScreen";
import { InterviewSetup } from "@/components/InterviewSetup";

export default function Home() {
  return (
    <>
      <HeroFullScreen />
      <FullWidthSection
        id="setup"
        className="pb-[var(--space-3xl)] pt-[var(--space-xl)]"
        contentClassName="space-y-6"
      >
        <div className="mx-auto max-w-3xl text-center">
          <p className="section-kicker">Interactive Setup</p>
          <h2 className="mt-3 section-title">Start a focused interview round</h2>
          <p className="mt-3 section-body">
            Pick the topic, experience level, and pressure profile you want to train,
            then jump straight into the live interview flow.
          </p>
        </div>
        <InterviewSetup />
      </FullWidthSection>
    </>
  );
}

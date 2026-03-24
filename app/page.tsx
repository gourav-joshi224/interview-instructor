import { FullWidthSection } from "@/components/FullWidthSection";
import { HeroFullScreen } from "@/components/HeroFullScreen";
import { InterviewSetup } from "@/components/InterviewSetup";
import type { RetryParams } from "@/lib/local-history";

type HomeProps = {
  searchParams?: {
    retryTopic?: string;
    retryExperience?: string;
    retryDifficulty?: string;
    retryTotalQuestions?: string;
    retryConcepts?: string;
    retryWeakAreas?: string;
  };
};

const parseRetryList = (value?: string) =>
  value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

export default function Home({ searchParams }: HomeProps) {
  const retryParams: RetryParams | null =
    searchParams?.retryTopic && searchParams.retryExperience && searchParams.retryDifficulty && searchParams.retryTotalQuestions
      ? {
          topic: searchParams.retryTopic,
          experience: searchParams.retryExperience,
          difficulty: searchParams.retryDifficulty,
          totalQuestions: searchParams.retryTotalQuestions,
          focusConcepts: parseRetryList(searchParams.retryConcepts),
          sourceWeakAreas: parseRetryList(searchParams.retryWeakAreas),
        }
      : null;

  return (
    <>
      <HeroFullScreen />
      <FullWidthSection
        id="setup"
        className="scroll-mt-28 pb-[var(--space-3xl)] pt-3 sm:scroll-mt-32"
        contentClassName="full-app-shell space-y-6 pb-[var(--space-3xl)]"
        fullBleed
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:items-end">
          <p className="section-kicker">Interactive Setup</p>
          <div className="space-y-3 lg:max-w-2xl">
            <h2 className="section-title">Start a focused interview round</h2>
            <p className="section-body">
              Pick the topic, experience level, and pressure profile you want to train,
              then jump straight into the live interview flow.
            </p>
          </div>
          <div className="soft-card hidden rounded-[1.5rem] p-5 lg:block">
            <p className="section-kicker">Why this layout works</p>
            <p className="mt-3 text-sm leading-7 text-[var(--color-text-primary)]">
              The setup stays edge-to-edge, the form becomes the main event, and each choice now reads like a guided control instead of a default admin form.
            </p>
          </div>
        </div>
        <InterviewSetup retryParams={retryParams} />
      </FullWidthSection>
    </>
  );
}

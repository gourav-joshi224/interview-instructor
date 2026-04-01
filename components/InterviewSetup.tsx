"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronRight,
  FileText,
  FileUp,
  Gauge,
  Layers3,
  Sparkles,
  Target,
  TriangleAlert,
  UploadCloud,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getSessionScores, type RetryParams, type ScoreEntry } from "@/lib/local-history";

type ChoiceOption = {
  label: string;
  description: string;
};

const TOPICS: ChoiceOption[] = [
  { label: "System Design", description: "Design APIs, services, and data flow for real products." },
  { label: "Databases", description: "Schema design, indexing, transactions, and scaling tradeoffs." },
  { label: "Caching", description: "Redis patterns, invalidation strategies, and performance tuning." },
  { label: "Queues", description: "Async jobs, retries, dead letters, and delivery guarantees." },
  { label: "APIs", description: "REST, idempotency, auth, pagination, and versioning." },
  { label: "Concurrency", description: "Locks, race conditions, consistency, and throughput concerns." },
  { label: "JavaScript", description: "Async flows, event loop behavior, and runtime tradeoffs." },
  { label: "Node.js", description: "Streams, process model, APIs, and backend performance patterns." },
];

const EXPERIENCE_LEVELS: ChoiceOption[] = [
  { label: "Junior", description: "Foundational backend concepts and practical tradeoffs." },
  { label: "Mid-Level", description: "Production reasoning, debugging, and scaling decisions." },
  { label: "Senior", description: "Architecture depth, ownership, and systems thinking." },
];

const HEAT_MODES: ChoiceOption[] = [
  { label: "Warm Up", description: "Comfortable pace with accessible interview questions." },
  { label: "On Call", description: "Balanced difficulty with realistic production pressure." },
  { label: "Incident Mode", description: "Sharper edge with deeper follow-up expectations." },
];

const QUESTION_COUNTS: ChoiceOption[] = [
  { label: "3", description: "Brief warm-up set." },
  { label: "5", description: "Quick focused round." },
  { label: "10", description: "Balanced full interview set." },
];

const INTERVIEW_MODES: ChoiceOption[] = [
  { label: "Standard Interview", description: "Generate questions from selected topic and interview setup." },
  { label: "Resume Based Interview", description: "Upload a resume and get questions based on supported skills." },
];

const STEP_TITLES = [
  "Select Interview Type",
  "Pick Your Primary Topic",
  "Set Experience Band",
  "Tune Session Pressure",
  "Review and Launch",
] as const;

const STEP_DESCRIPTIONS = [
  "Choose standard or resume-driven questions to fit your prep style.",
  "Focus one topic at a time for sharper, measurable progress.",
  "Calibrate answers and feedback depth to your target role.",
  "Adjust interview heat and question count before the session starts.",
  "Confirm setup and begin a guided backend interview round.",
] as const;

const MAX_RESUME_SIZE_BYTES = 2 * 1024 * 1024;

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read the resume PDF."));
    reader.readAsDataURL(file);
  });

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

type ChoiceCardProps = {
  option: ChoiceOption;
  selected: boolean;
  onSelect: () => void;
};

function ChoiceCard({ option, selected, onSelect }: ChoiceCardProps) {
  const optionId = slugify(option.label);

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={{ scale: 0.985 }}
      className={`group relative w-full overflow-hidden rounded-[1.4rem] border p-4 text-left transition-[transform,border-color,background-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] ${
        selected
          ? "border-[rgba(176,236,112,0.95)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(215,226,214,0.92)_100%)] shadow-[0_12px_28px_rgba(20,69,22,0.12)]"
          : "border-[rgba(65,105,67,0.16)] bg-[rgba(255,255,255,0.72)] shadow-[0_4px_16px_rgba(20,69,22,0.04)] hover:-translate-y-0.5 hover:border-[rgba(65,105,67,0.28)] hover:bg-[rgba(255,255,255,0.9)]"
      }`}
      aria-pressed={selected}
      aria-describedby={`${optionId}-description`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.48)_50%,transparent_100%)] opacity-70" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-[16px] font-semibold tracking-[-0.01em] text-[var(--color-text-primary)]">{option.label}</p>
          <p id={`${optionId}-description`} className="text-sm leading-6 text-[var(--color-text-secondary)]">
            {option.description}
          </p>
        </div>

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition ${
            selected
              ? "border-[rgba(20,69,22,0.12)] bg-[rgba(176,236,112,0.34)] text-[var(--color-primary-dark)]"
              : "border-[rgba(65,105,67,0.12)] bg-[var(--color-surface-light)] text-[var(--color-text-secondary)]"
          }`}
          aria-hidden="true"
        >
          {selected ? <Check className="h-4 w-4" strokeWidth={2.2} /> : <ChevronRight className="h-4 w-4" strokeWidth={2.2} />}
        </div>
      </div>

      {selected ? (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[rgba(176,236,112,0.24)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-primary-dark)]">
          <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2.2} />
          Selected
        </div>
      ) : null}
    </motion.button>
  );
}

type InterviewSetupProps = {
  retryParams?: RetryParams | null;
};

export function InterviewSetup({ retryParams = null }: InterviewSetupProps) {
  const router = useRouter();
  const { user, loading, signIn } = useAuth();
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [topic, setTopic] = useState("");
  const [experience, setExperience] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [totalQuestions, setTotalQuestions] = useState("5");
  const [mode, setMode] = useState("Standard Interview");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [lastTopicScore, setLastTopicScore] = useState<ScoreEntry | null>(null);

  const totalSteps = STEP_TITLES.length;
  const progress = ((step + 1) / totalSteps) * 100;

  useEffect(() => {
    if (!topic) {
      setLastTopicScore(null);
      return;
    }

    const topicScores = getSessionScores(topic);
    setLastTopicScore(topicScores.length > 0 ? topicScores[topicScores.length - 1] : null);
  }, [topic]);

  useEffect(() => {
    if (!retryParams) {
      return;
    }

    setMode("Standard Interview");
    setResumeFile(null);
    setTopic(retryParams.topic);
    setExperience(retryParams.experience);
    setDifficulty(retryParams.difficulty);
    setTotalQuestions(retryParams.totalQuestions);
    setError("");
  }, [retryParams]);

  const canStart = useMemo(
    () =>
      Boolean(
        topic &&
          experience &&
          difficulty &&
          totalQuestions &&
          (mode !== "Resume Based Interview" || resumeFile),
      ),
    [difficulty, experience, mode, resumeFile, topic, totalQuestions],
  );

  const summaryItems = useMemo(
    () => [
      { label: "Mode", value: mode, icon: Layers3 },
      { label: "Topic", value: topic || "Choose one topic", icon: Target },
      { label: "Experience", value: experience || "Select level", icon: Gauge },
      { label: "Heat", value: difficulty || "Pick a mode", icon: Zap },
      { label: "Questions", value: totalQuestions, icon: FileText },
      {
        label: "Resume",
        value: resumeFile?.name ?? (mode === "Resume Based Interview" ? "Required PDF upload" : "Not needed"),
        icon: UploadCloud,
      },
    ],
    [difficulty, experience, mode, resumeFile, topic, totalQuestions],
  );

  const readinessChecks = useMemo(
    () => [
      { label: "Mode chosen", complete: Boolean(mode) },
      { label: "Topic selected", complete: Boolean(topic) },
      { label: "Experience set", complete: Boolean(experience) },
      { label: "Heat selected", complete: Boolean(difficulty) },
      { label: "Question count set", complete: Boolean(totalQuestions) },
      {
        label: "Resume ready",
        complete: mode !== "Resume Based Interview" || Boolean(resumeFile),
      },
    ],
    [difficulty, experience, mode, resumeFile, topic, totalQuestions],
  );
  const completedChecksCount = readinessChecks.filter((item) => item.complete).length;

  const validateStep = (stepIndex: number) => {
    if (stepIndex === 0) {
      if (mode === "Resume Based Interview" && !resumeFile) {
        setError("Upload a resume PDF to continue.");
        return false;
      }
      return true;
    }

    if (stepIndex === 1 && !topic) {
      setError("Choose one core topic to continue.");
      return false;
    }

    if (stepIndex === 2 && !experience) {
      setError("Pick your target experience level.");
      return false;
    }

    if (stepIndex === 3 && (!difficulty || !totalQuestions)) {
      setError("Select a heat mode and question count.");
      return false;
    }

    return true;
  };

  const nextStep = () => {
    setError("");
    if (!validateStep(step)) {
      return;
    }
    setStep((current) => Math.min(current + 1, totalSteps - 1));
  };

  const prevStep = () => {
    setError("");
    setStep((current) => Math.max(current - 1, 0));
  };

  const startInterview = async () => {
    if (loading) {
      return;
    }

    if (!user) {
      setError("");
      setSigningIn(true);

      try {
        await signIn();
      } catch {
        setError("Please sign in with Google to start your interview.");
        setSigningIn(false);
        return;
      }

      setSigningIn(false);
    }

    if (!canStart) {
      setError("Complete all required preferences before starting.");
      return;
    }

    setError("");
    setSubmitting(true);
    const normalizedMode = mode === "Resume Based Interview" ? "resume" : "standard";

    try {
      if (normalizedMode === "resume") {
        if (!resumeFile) {
          setError("Upload a resume PDF to start resume-based interviews.");
          setSubmitting(false);
          return;
        }

        if (resumeFile.type !== "application/pdf") {
          setError("Resume upload accepts PDF files only.");
          setSubmitting(false);
          return;
        }

        if (resumeFile.size > MAX_RESUME_SIZE_BYTES) {
          setError("Resume PDF is too large. Keep it under 2 MB.");
          setSubmitting(false);
          return;
        }

        const resumeDataUrl = await fileToDataUrl(resumeFile);
        sessionStorage.setItem("interview-resume-data-url", resumeDataUrl);
        sessionStorage.setItem("interview-resume-file-name", resumeFile.name);
      } else {
        sessionStorage.removeItem("interview-resume-data-url");
        sessionStorage.removeItem("interview-resume-file-name");
      }
    } catch {
      setError("Could not read the resume PDF. Please try another file.");
      setSubmitting(false);
      return;
    }

    const params = new URLSearchParams({
      topic,
      experience,
      difficulty,
      mode: normalizedMode,
      totalQuestions,
    });

    router.push(`/interview?${params.toString()}`);
  };

  return (
    <div className="w-full">
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="surface-card min-h-[100dvh] min-w-0 overflow-hidden rounded-none border-x-0"
      >
        <div className="relative overflow-hidden bg-gradient-balance-card px-4 py-5 text-[var(--color-text-on-dark)] sm:px-6 sm:py-6 lg:px-8 lg:py-7 xl:px-10">
          <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[rgba(176,236,112,0.18)] blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-44 w-44 rounded-full bg-white/8 blur-3xl" />

          <div className="relative flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-4xl space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/78">
                  <Sparkles className="h-3.5 w-3.5 text-[var(--color-accent)]" strokeWidth={2.2} />
                  Interview builder
                </div>
                <div className="space-y-2">
                  <h2 className="max-w-4xl text-type-display tracking-[-0.04em] text-white sm:text-[2.7rem] lg:text-[3.35rem]">
                    Build your backend interview from one focused, full-screen setup flow.
                  </h2>
                  <p className="max-w-2xl text-sm leading-6 text-white/78 sm:text-base sm:leading-7">
                    Choose the interview type, calibrate the pressure, and launch from a cleaner web layout where the form does the heavy lifting.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTopic("System Design");
                    setExperience("Mid-Level");
                    setDifficulty("On Call");
                    setTotalQuestions("10");
                    setMode("Standard Interview");
                    setResumeFile(null);
                    setError("");
                    setStep(4);
                  }}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-white/18 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-primary-dark)]"
                >
                  <Sparkles className="h-4 w-4 text-[var(--color-accent)]" strokeWidth={2} />
                  Quick preset
                </button>

                <div
                  className={`inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold ${
                    canStart
                      ? "bg-[rgba(176,236,112,0.18)] text-[var(--color-accent)]"
                      : "bg-white/10 text-white/80"
                  }`}
                >
                  <BadgeCheck className="h-4 w-4" strokeWidth={2.2} />
                  {canStart ? "Ready to launch" : `${completedChecksCount}/${readinessChecks.length} ready`}
                </div>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3 lg:max-w-3xl">
              {[
                { label: "Guided steps", value: "5-stage flow" },
                { label: "Focus mode", value: "One topic at a time" },
                { label: "Output", value: "Session-ready payload" },
              ].map((item) => (
                <div key={item.label} className="rounded-[1.1rem] border border-white/12 bg-white/8 px-3 py-2.5 backdrop-blur-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/66">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 xl:px-10">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_18rem] xl:items-start">
            <div className="space-y-4 rounded-[1.6rem] border border-[rgba(65,105,67,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(248,250,246,0.98)_100%)] p-4 shadow-[0_14px_36px_rgba(20,69,22,0.06)] sm:p-5 lg:p-6">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
                {STEP_TITLES.map((title, index) => {
                  const active = step === index;
                  const complete = step > index;

                  return (
                    <button
                      key={title}
                      type="button"
                      onClick={() => setStep(index)}
                      className={`flex min-h-[84px] min-w-0 items-start gap-3 rounded-[1.2rem] border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] ${
                        active
                          ? "border-[rgba(20,69,22,0.16)] bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(215,226,214,0.9)_100%)] shadow-[0_12px_28px_rgba(20,69,22,0.1)]"
                          : complete
                            ? "border-[rgba(176,236,112,0.58)] bg-[rgba(176,236,112,0.14)]"
                            : "border-[rgba(65,105,67,0.1)] bg-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,255,255,0.96)]"
                      }`}
                      aria-current={active ? "step" : undefined}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition ${
                          active
                            ? "bg-[var(--color-primary-dark)] text-white"
                            : complete
                              ? "bg-[rgba(176,236,112,0.32)] text-[var(--color-primary-dark)]"
                              : "bg-[var(--color-surface-light)] text-[var(--color-text-secondary)]"
                        }`}
                      >
                        {complete ? <Check className="h-4 w-4" strokeWidth={2.4} /> : index + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
                          {active ? "Current step" : complete ? "Completed" : "Upcoming"}
                        </span>
                        <span className="mt-0.5 block text-sm font-semibold leading-5 text-[var(--color-text-primary)]">
                          {title}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="progress-rail" aria-hidden="true">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>

              <div className="space-y-4 pt-1">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="section-kicker">Step {step + 1} of {totalSteps}</p>
                    <h3 className="text-type-h2 tracking-[-0.015em] text-[var(--color-text-primary)]">{STEP_TITLES[step]}</h3>
                  </div>
                  <p className="max-w-xl text-sm leading-6 text-[var(--color-text-secondary)]">{STEP_DESCRIPTIONS[step]}</p>
                </div>

                {retryParams ? (
                  <div className="flex flex-wrap items-start gap-3 rounded-[1.25rem] border border-[rgba(20,69,22,0.1)] bg-[rgba(215,226,214,0.44)] px-4 py-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(176,236,112,0.24)] text-[var(--color-primary-dark)]">
                      <Target className="h-4.5 w-4.5" strokeWidth={2.1} />
                    </div>
                    <div className="min-w-0">
                      <p className="section-kicker">Focusing on</p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-[var(--color-text-primary)]">
                        {(retryParams.focusConcepts.length > 0 ? retryParams.focusConcepts : retryParams.sourceWeakAreas).join(" • ")}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
                        Retry preset loaded with {retryParams.difficulty} difficulty and {retryParams.totalQuestions} questions.
                      </p>
                    </div>
                  </div>
                ) : null}

                {error ? (
                  <div
                    className="flex items-start gap-3 rounded-[1.25rem] border border-[rgba(229,57,53,0.18)] bg-[var(--color-danger-light)] px-4 py-3 text-sm text-[var(--color-text-primary)]"
                    role="alert"
                  >
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-danger)]" strokeWidth={2.2} />
                    <span className="leading-6 text-[var(--color-text-primary)]">{error}</span>
                  </div>
                ) : null}

                <motion.div
                  key={step}
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.24 }}
                  className="min-h-[360px]"
                >
                  {step === 0 ? (
                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {INTERVIEW_MODES.map((item) => (
                          <ChoiceCard
                            key={item.label}
                            option={item}
                            selected={mode === item.label}
                            onSelect={() => {
                              setMode(item.label);
                              if (item.label !== "Resume Based Interview") {
                                setResumeFile(null);
                              }
                              setError("");
                            }}
                          />
                        ))}
                      </div>

                      {mode === "Resume Based Interview" ? (
                        <div className="surface-card overflow-hidden p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-surface-light)] text-[var(--color-primary-dark)]">
                              <FileUp className="h-5 w-5" strokeWidth={2} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-[var(--color-text-primary)]">Resume upload</p>
                              <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
                                PDF only. Keep it under 2 MB so the resume flow stays fast and stable.
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 rounded-[1.35rem] border border-dashed border-[rgba(65,105,67,0.24)] bg-[rgba(215,226,214,0.42)] p-4">
                            <input
                              id="resume-upload"
                              type="file"
                              accept="application/pdf"
                              className="sr-only"
                              onChange={(event) => {
                                const file = event.target.files?.[0] ?? null;
                                setResumeFile(file);
                                setError("");
                              }}
                            />

                            <label
                              htmlFor="resume-upload"
                              className="flex cursor-pointer flex-col gap-3 rounded-[1.15rem] border border-[rgba(65,105,67,0.14)] bg-[rgba(255,255,255,0.74)] p-4 transition hover:-translate-y-0.5 hover:bg-white focus-within:ring-2 focus-within:ring-[var(--color-accent)]"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 space-y-1">
                                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">Choose a PDF resume</p>
                                  <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                                    Use a recent resume so the prompt generation can follow your actual experience.
                                  </p>
                                </div>

                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(176,236,112,0.28)] text-[var(--color-primary-dark)]">
                                  <UploadCloud className="h-4 w-4" strokeWidth={2.2} />
                                </div>
                              </div>

                              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[rgba(20,69,22,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-primary-dark)]">
                                <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2.2} />
                                {resumeFile ? "File selected" : "No file selected"}
                              </div>
                            </label>

                            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                              <span className="rounded-full bg-[rgba(255,255,255,0.72)] px-3 py-1">Accepted: PDF</span>
                              <span className="rounded-full bg-[rgba(255,255,255,0.72)] px-3 py-1">Max size: 2 MB</span>
                              {resumeFile ? (
                                <span className="rounded-full bg-[rgba(176,236,112,0.22)] px-3 py-1 text-[var(--color-primary-dark)]">
                                  {resumeFile.name}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {step === 1 ? (
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {TOPICS.map((item) => (
                          <ChoiceCard
                            key={item.label}
                            option={item}
                            selected={topic === item.label}
                            onSelect={() => {
                              setTopic(item.label);
                              setError("");
                            }}
                          />
                        ))}
                      </div>

                      {lastTopicScore ? (
                        <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                          Last session: {lastTopicScore.score}/100 on {lastTopicScore.difficulty} ({lastTopicScore.experience})
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {step === 2 ? (
                    <div className="grid gap-3 md:grid-cols-3">
                      {EXPERIENCE_LEVELS.map((item) => (
                        <ChoiceCard
                          key={item.label}
                          option={item}
                          selected={experience === item.label}
                          onSelect={() => {
                            setExperience(item.label);
                            setError("");
                          }}
                        />
                      ))}
                    </div>
                  ) : null}

                  {step === 3 ? (
                    <div className="space-y-5">
                      <div className="surface-card p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-surface-light)] text-[var(--color-primary-dark)]">
                            <Gauge className="h-5 w-5" strokeWidth={2} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Interview heat</p>
                            <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
                              Pick the pressure level you want the round to feel like. Higher modes bring sharper
                              follow-ups and more production-style reasoning.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                            Heat mode
                          </p>
                          <p className="text-xs text-[var(--color-text-secondary)]">Affects the tone and depth of follow-ups</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          {HEAT_MODES.map((item) => (
                            <ChoiceCard
                              key={item.label}
                              option={item}
                              selected={difficulty === item.label}
                              onSelect={() => {
                                setDifficulty(item.label);
                                setError("");
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="surface-card p-4 sm:p-5">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                            Question count
                          </p>
                          <p className="text-xs text-[var(--color-text-secondary)]">Larger counts unlock deeper rounds</p>
                        </div>

                        <div className="inline-flex w-full flex-wrap gap-2 rounded-[1.35rem] bg-[var(--color-surface-light)] p-2 sm:w-auto">
                          {QUESTION_COUNTS.map((item) => {
                            const selected = totalQuestions === item.label;

                            return (
                              <button
                                key={item.label}
                                type="button"
                                className={`min-w-[84px] flex-1 rounded-full px-5 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-light)] sm:flex-none ${
                                  selected
                                    ? "bg-[var(--color-accent)] text-[var(--color-primary-dark)] shadow-[0_6px_16px_rgba(176,236,112,0.24)]"
                                    : "text-[var(--color-text-secondary)] hover:bg-[rgba(255,255,255,0.7)] hover:text-[var(--color-primary)]"
                                }`}
                                onClick={() => {
                                  setTotalQuestions(item.label);
                                  setError("");
                                }}
                              >
                                {item.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {step === 4 ? (
                    <div className="space-y-4">
                      <div className="surface-card overflow-hidden p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="section-kicker">Final setup summary</p>
                            <h4 className="mt-2 text-type-h3 text-[var(--color-text-primary)]">
                              Review the session before launching.
                            </h4>
                          </div>
                          <div
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                              canStart
                                ? "bg-[rgba(176,236,112,0.22)] text-[var(--color-primary-dark)]"
                                : "bg-[rgba(229,57,53,0.12)] text-[var(--color-danger)]"
                            }`}
                          >
                            {canStart ? <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2.2} /> : <TriangleAlert className="h-3.5 w-3.5" strokeWidth={2.2} />}
                            {canStart ? "Ready" : "Incomplete"}
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {summaryItems.map((item) => {
                            const Icon = item.icon;
                            const isResumeMissing = item.label === "Resume" && mode === "Resume Based Interview" && !resumeFile;

                            return (
                              <div
                                key={item.label}
                                className={`rounded-[1.1rem] border p-4 ${
                                  isResumeMissing
                                    ? "border-[rgba(229,57,53,0.18)] bg-[var(--color-danger-light)]"
                                    : "border-[rgba(65,105,67,0.12)] bg-[var(--color-surface-light)]"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-[var(--color-primary-dark)]">
                                    <Icon className="h-4 w-4" strokeWidth={2} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                                      {item.label}
                                    </p>
                                    <p className="mt-1 break-words text-sm font-semibold leading-5 text-[var(--color-text-primary)]">
                                      {item.value}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="surface-card p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-surface-light)] text-[var(--color-primary-dark)]">
                            <FileText className="h-5 w-5" strokeWidth={2} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Readiness checklist</p>
                            <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
                              The strongest setup is one where the prompt is narrow, the pacing is calibrated, and every
                              required control is visible before launch.
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          {readinessChecks.map((item) => (
                            <div
                              key={item.label}
                              className={`flex items-center gap-3 rounded-[1rem] border px-3 py-3 text-sm ${
                                item.complete
                                  ? "border-[rgba(176,236,112,0.45)] bg-[rgba(176,236,112,0.14)] text-[var(--color-text-primary)]"
                                  : "border-[rgba(65,105,67,0.12)] bg-[rgba(255,255,255,0.7)] text-[var(--color-text-secondary)]"
                              }`}
                            >
                              <span
                                className={`flex h-7 w-7 items-center justify-center rounded-full ${
                                  item.complete
                                    ? "bg-[rgba(176,236,112,0.3)] text-[var(--color-primary-dark)]"
                                    : "bg-[var(--color-surface-light)] text-[var(--color-text-secondary)]"
                                }`}
                                aria-hidden="true"
                              >
                                {item.complete ? <Check className="h-4 w-4" strokeWidth={2.4} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                              </span>
                              <span className="font-medium">{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </motion.div>

                <div className="flex flex-col-reverse gap-3 border-t border-[rgba(65,105,67,0.12)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={step === 0}
                    className="secondary-btn disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
                    Previous step
                  </button>

                  {step < totalSteps - 1 ? (
                    <button type="button" className="primary-btn" onClick={nextStep}>
                      Continue
                      <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={() => {
                        void startInterview();
                      }}
                      disabled={submitting || loading || signingIn}
                    >
                      {signingIn ? (
                        "Signing in..."
                      ) : loading ? (
                        "Loading..."
                      ) : submitting ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
                          Preparing interview...
                        </>
                      ) : (
                        <>
                          Start interview
                          <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[1.35rem] border border-[rgba(65,105,67,0.1)] bg-[rgba(255,255,255,0.76)] p-3.5 shadow-[0_8px_24px_rgba(20,69,22,0.04)] sm:p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="section-kicker">Readiness</p>
                  <h3 className="mt-1 text-base font-semibold text-[var(--color-text-primary)] sm:text-lg">
                    {completedChecksCount}/{readinessChecks.length} controls complete
                  </h3>
                </div>
                <div className="rounded-full bg-[rgba(20,69,22,0.06)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
                  Live
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {readinessChecks.map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-3 rounded-[0.95rem] border px-3 py-2.5 text-sm ${
                      item.complete
                        ? "border-[rgba(176,236,112,0.45)] bg-[rgba(176,236,112,0.14)] text-[var(--color-text-primary)]"
                        : "border-[rgba(65,105,67,0.12)] bg-[rgba(255,255,255,0.7)] text-[var(--color-text-secondary)]"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        item.complete
                          ? "bg-[rgba(176,236,112,0.3)] text-[var(--color-primary-dark)]"
                          : "bg-[var(--color-surface-light)] text-[var(--color-text-secondary)]"
                      }`}
                      aria-hidden="true"
                    >
                      {item.complete ? <Check className="h-4 w-4" strokeWidth={2.4} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                    </span>
                    <span className="font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

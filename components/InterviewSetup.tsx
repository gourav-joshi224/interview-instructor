"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, FileText, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

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
  // { label: "Java", description: "JVM internals, concurrency primitives, and memory behavior." },
  // { label: "C", description: "Memory management, pointers, performance, and threading basics." },
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
  { label: "5", description: "Quick focused round." },
  { label: "10", description: "Balanced full interview set." },
  { label: "15", description: "Extended deep-dive session." },
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

type ChoiceCardProps = {
  option: ChoiceOption;
  selected: boolean;
  onSelect: () => void;
};

function ChoiceCard({ option, selected, onSelect }: ChoiceCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.985 }}
      className={`surface-card w-full cursor-pointer p-4 text-left transition-colors ${
        selected ? "border-[var(--color-accent)] bg-[rgba(176,236,112,0.22)]" : "border-[rgba(65,105,67,0.16)]"
      }`}
      aria-pressed={selected}
    >
      <p className="text-type-body font-semibold text-[var(--color-text-primary)]">{option.label}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{option.description}</p>
    </motion.button>
  );
}

export function InterviewSetup() {
  const router = useRouter();
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

  const totalSteps = STEP_TITLES.length;
  const progress = ((step + 1) / totalSteps) * 100;

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
    <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[1.16fr_0.84fr]">
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="surface-card p-5 sm:p-6"
      >
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="section-kicker">Interview Builder</p>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Step {step + 1} of {totalSteps}
            </p>
          </div>
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
            className="secondary-btn"
          >
            <Sparkles className="h-4 w-4" strokeWidth={1.8} />
            Quick preset
          </button>
        </div>

        <h2 className="text-type-h1 tracking-[-0.01em] text-[var(--color-text-primary)]">{STEP_TITLES[step]}</h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
          {STEP_DESCRIPTIONS[step]}
        </p>

        <div className="mt-5 progress-rail">
          <div className="progress-fill" style={{ width: `${progress}%` }} aria-hidden="true" />
        </div>

        <div className="mt-7 min-h-[350px]">
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
                <label className="surface-card block p-4 text-sm text-[var(--color-text-primary)]">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
                    Upload Resume (PDF)
                  </span>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="interactive-field h-auto py-2"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setResumeFile(file);
                      setError("");
                    }}
                  />
                  <span className="mt-2 block text-xs text-[var(--color-text-secondary)]">PDF only. Max 2 MB.</span>
                  {resumeFile ? (
                    <span className="mt-2 block text-sm font-medium text-[var(--color-primary-dark)]">
                      Selected: {resumeFile.name}
                    </span>
                  ) : null}
                </label>
              ) : null}
            </div>
          ) : null}

          {step === 1 ? (
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
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
                  Interview Heat Mode
                </p>
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

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
                  Question Count
                </p>
                <div className="soft-card inline-flex h-11 items-center gap-1 rounded-full p-1">
                  {QUESTION_COUNTS.map((item) => {
                    const selected = totalQuestions === item.label;

                    return (
                      <button
                        key={item.label}
                        type="button"
                        className={`h-9 rounded-full px-5 text-sm font-semibold transition ${
                          selected
                            ? "bg-[var(--color-accent)] text-[var(--color-primary-dark)]"
                            : "text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
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
            <div className="surface-card p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
                Final Setup Summary
              </p>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div className="soft-card rounded-xl p-3">
                  <p className="text-xs text-[var(--color-text-secondary)]">Mode</p>
                  <p className="mt-1 font-semibold text-[var(--color-text-primary)]">{mode}</p>
                </div>
                <div className="soft-card rounded-xl p-3">
                  <p className="text-xs text-[var(--color-text-secondary)]">Topic</p>
                  <p className="mt-1 font-semibold text-[var(--color-text-primary)]">{topic || "Not selected"}</p>
                </div>
                <div className="soft-card rounded-xl p-3">
                  <p className="text-xs text-[var(--color-text-secondary)]">Experience</p>
                  <p className="mt-1 font-semibold text-[var(--color-text-primary)]">{experience || "Not selected"}</p>
                </div>
                <div className="soft-card rounded-xl p-3">
                  <p className="text-xs text-[var(--color-text-secondary)]">Heat Mode</p>
                  <p className="mt-1 font-semibold text-[var(--color-text-primary)]">{difficulty || "Not selected"}</p>
                </div>
                <div className="soft-card rounded-xl p-3">
                  <p className="text-xs text-[var(--color-text-secondary)]">Question Count</p>
                  <p className="numeric-tabular mt-1 font-semibold text-[var(--color-text-primary)]">{totalQuestions}</p>
                </div>
                <div className="soft-card rounded-xl p-3">
                  <p className="text-xs text-[var(--color-text-secondary)]">Resume</p>
                  <p className="mt-1 truncate font-semibold text-[var(--color-text-primary)]">
                    {resumeFile?.name ?? (mode === "Resume Based Interview" ? "Required" : "Not needed")}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {error ? <p className="mt-4 text-sm font-medium text-[var(--color-danger)]">{error}</p> : null}

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
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
              disabled={submitting}
            >
              {submitting ? "Preparing interview..." : "Start interview"}
              <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
            </button>
          )}
        </div>
      </motion.section>

      <motion.aside
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="flex h-full flex-col gap-6"
      >
        <div className="surface-card p-5 sm:p-6">
          <p className="section-kicker">Live Summary</p>
          <div className="mt-4 space-y-4">
            {[
              { label: "Interview mode", value: mode },
              { label: "Topic", value: topic || "Choose one topic" },
              { label: "Experience", value: experience || "Select level" },
              { label: "Heat", value: difficulty || "Pick a mode" },
              { label: "Questions", value: totalQuestions },
            ].map((item) => (
              <div key={item.label} className="soft-card rounded-xl p-4">
                <p className="text-xs uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">{item.label}</p>
                <p className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.5rem] bg-gradient-balance-card p-5 text-[var(--color-text-on-dark)] shadow-[0_8px_32px_rgba(20,69,22,0.25)] sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
              <FileText className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/68">Session intent</p>
              <p className="mt-1 text-lg font-semibold">Train one topic with measurable feedback.</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-white/78">
            The setup values and route payloads stay exactly the same. This refactor only improves clarity,
            spacing, contrast, and overall product cohesion.
          </p>
        </div>

        <div className="surface-card p-5 sm:p-6">
          <p className="section-kicker">What Changes Visually</p>
          <div className="mt-4 space-y-4">
            {[
              "No stark white shells on light backgrounds.",
              "Consistent spacing, typography, and logo placement.",
              "Inputs and progress states now use the design-system tokens.",
            ].map((item) => (
              <div key={item} className="flex gap-3">
                <span className="mt-2 h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
                <p className="text-sm leading-6 text-[var(--color-text-secondary)]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.aside>
    </div>
  );
}

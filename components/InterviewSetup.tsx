"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const TOPICS = [
  {
    label: "System Design",
    description: "Design APIs, services, and data flow for real products.",
  },
  {
    label: "Databases",
    description: "Schema design, indexing, transactions, and scaling tradeoffs.",
  },
  {
    label: "Caching",
    description: "Redis patterns, invalidation strategies, and performance tuning.",
  },
  {
    label: "Queues",
    description: "Async jobs, retries, dead letters, and delivery guarantees.",
  },
  {
    label: "APIs",
    description: "REST, idempotency, auth, pagination, and versioning.",
  },
  {
    label: "Concurrency",
    description: "Locks, race conditions, consistency, and throughput concerns.",
  },
  {
    label: "JavaScript",
    description: "Async flows, event loop behavior, and runtime tradeoffs.",
  },
  {
    label: "Node.js",
    description: "Streams, process model, APIs, and backend performance patterns.",
  },
  {
    label: "Java",
    description: "JVM internals, concurrency primitives, and memory behavior.",
  },
  {
    label: "C",
    description: "Memory management, pointers, performance, and threading basics.",
  },
];

const EXPERIENCE_LEVELS = [
  {
    label: "Junior",
    description: "Foundational backend concepts and practical tradeoffs.",
  },
  {
    label: "Mid-Level",
    description: "Production reasoning, debugging, and scaling decisions.",
  },
  {
    label: "Senior",
    description: "Architecture depth, ownership, and systems thinking.",
  },
];

const HEAT_MODES = [
  {
    label: "Warm Up",
    description: "Comfortable pace with accessible interview questions.",
  },
  {
    label: "On Call",
    description: "Balanced difficulty with realistic production pressure.",
  },
  {
    label: "Incident Mode",
    description: "Sharper edge with deeper follow-up expectations.",
  },
];

const QUESTION_COUNTS = [
  {
    label: "5",
    description: "Quick focused round.",
  },
  {
    label: "10",
    description: "Balanced full interview set.",
  },
  {
    label: "15",
    description: "Extended deep-dive session.",
  },
];

const INTERVIEW_MODES = [
  {
    label: "Standard Interview",
    description: "Generate questions from selected topic and interview setup.",
  },
  {
    label: "Resume Based Interview",
    description: "Upload a resume and get questions based on supported skills.",
  },
];

const MAX_RESUME_SIZE_BYTES = 2 * 1024 * 1024;

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read the resume PDF."));
    reader.readAsDataURL(file);
  });

type SelectionGroupProps = {
  title: string;
  items: Array<{ label: string; description: string }>;
  value: string;
  onSelect: (value: string) => void;
};

function SelectionGroup({ title, items, value, onSelect }: SelectionGroupProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
            {title}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {items.map((item, index) => {
          const selected = value === item.label;

          return (
            <motion.button
              key={item.label}
              type="button"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => onSelect(item.label)}
              className={`glass-panel text-left transition-colors ${
                selected
                  ? "border-blue-400/60 bg-blue-500/[0.10] shadow-[0_0_0_1px_rgba(96,165,250,0.2)]"
                  : "border-white/8 hover:border-white/14"
              }`}
            >
              <motion.div animate={{ scale: selected ? 1.01 : 1 }}>
                <p className="text-lg font-medium text-zinc-100">{item.label}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {item.description}
                </p>
              </motion.div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}

export function InterviewSetup() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [experience, setExperience] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [totalQuestions, setTotalQuestions] = useState("5");
  const [mode, setMode] = useState("Standard Interview");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [error, setError] = useState("");

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

  const startInterview = async () => {
    if (!canStart) {
      return;
    }

    setError("");
    const normalizedMode = mode === "Resume Based Interview" ? "resume" : "standard";

    try {
      if (normalizedMode === "resume") {
        if (!resumeFile) {
          setError("Upload a resume PDF to start resume-based interviews.");
          return;
        }

        if (resumeFile.type !== "application/pdf") {
          setError("Resume upload accepts PDF files only.");
          return;
        }

        if (resumeFile.size > MAX_RESUME_SIZE_BYTES) {
          setError("Resume PDF is too large. Keep it under 2 MB.");
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
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10 sm:px-8 lg:px-12">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
      >
        <div className="max-w-2xl space-y-4">
          <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.28em] text-zinc-400">
            AI Backend Interview Gym
          </span>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-50 sm:text-5xl">
              Practice backend interviews with fast AI feedback.
            </h1>
            <p className="max-w-xl text-base leading-7 text-zinc-400 sm:text-lg">
              Pick a topic, set the pressure level, and run through a realistic
              developer interview loop with a clean, focused workspace.
            </p>
          </div>
        </div>

        <div className="glass-panel max-w-sm space-y-3">
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
            Session Preview
          </p>
          <div className="grid gap-2 text-sm text-zinc-300">
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-500">Mode</span>
              <span>{mode}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-500">Topic</span>
              <span>{topic || "Not selected"}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-500">Experience</span>
              <span>{experience || "Not selected"}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-500">Heat mode</span>
              <span>{difficulty || "Not selected"}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-500">Questions</span>
              <span>{totalQuestions || "Not selected"}</span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="space-y-8">
        <SelectionGroup
          title="Interview Mode"
          items={INTERVIEW_MODES}
          value={mode}
          onSelect={setMode}
        />
        {mode === "Resume Based Interview" ? (
          <section className="glass-panel space-y-4">
            <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Resume Upload</p>
            <div className="rounded-2xl border border-dashed border-white/14 bg-white/[0.02] p-4">
              <label className="block text-sm text-zinc-300">
                Upload Resume (PDF)
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setResumeFile(file);
                  }}
                  className="mt-3 block w-full rounded-xl border border-white/10 bg-zinc-950/70 px-3 py-2 text-sm text-zinc-200 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-500/20 file:px-3 file:py-1.5 file:text-sm file:text-blue-100 hover:file:bg-blue-500/30"
                />
              </label>
              <p className="mt-3 text-xs text-zinc-500">
                Supported: PDF only, max 2 MB. We use supported skills only.
              </p>
            </div>
            {resumeFile ? (
              <p className="text-sm text-cyan-300">Selected: {resumeFile.name}</p>
            ) : null}
          </section>
        ) : null}
        <SelectionGroup
          title="Topic"
          items={TOPICS}
          value={topic}
          onSelect={setTopic}
        />
        <SelectionGroup
          title="Experience Level"
          items={EXPERIENCE_LEVELS}
          value={experience}
          onSelect={setExperience}
        />
        <SelectionGroup
          title="Interview Heat Mode"
          items={HEAT_MODES}
          value={difficulty}
          onSelect={setDifficulty}
        />
        <SelectionGroup
          title="Question Count"
          items={QUESTION_COUNTS}
          value={totalQuestions}
          onSelect={setTotalQuestions}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-10 flex flex-col gap-4 border-t border-white/8 pt-8 sm:flex-row sm:items-center sm:justify-between"
      >
        <p className="text-sm text-zinc-500">
          Smooth prompt generation, quick evaluation, and minimal backend setup.
        </p>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <motion.button
          type="button"
          whileHover={canStart ? { scale: 1.02 } : undefined}
          whileTap={canStart ? { scale: 0.985 } : undefined}
          onClick={() => {
            void startInterview();
          }}
          disabled={!canStart}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-blue-500 px-6 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
        >
          Start Interview
        </motion.button>
      </motion.div>
    </div>
  );
}

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

  const canStart = useMemo(
    () => Boolean(topic && experience && difficulty),
    [difficulty, experience, topic],
  );

  const startInterview = () => {
    if (!canStart) {
      return;
    }

    const params = new URLSearchParams({
      topic,
      experience,
      difficulty,
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
          </div>
        </div>
      </motion.div>

      <div className="space-y-8">
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
        <motion.button
          type="button"
          whileHover={canStart ? { scale: 1.02 } : undefined}
          whileTap={canStart ? { scale: 0.985 } : undefined}
          onClick={startInterview}
          disabled={!canStart}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-blue-500 px-6 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
        >
          Start Interview
        </motion.button>
      </motion.div>
    </div>
  );
}

import type { SkillBreakdown } from "@/lib/types";

export type TopicSkillMetric = {
  key: string;
  label: string;
  keywords: string[];
};

export const skillMapping: Record<string, TopicSkillMetric[]> = {
  javascript: [
    { key: "closures", label: "Closures", keywords: ["closure", "lexical", "scope"] },
    { key: "prototype", label: "Prototype Chain", keywords: ["prototype", "inheritance"] },
    { key: "async", label: "Async Programming", keywords: ["async", "promise", "await"] },
    { key: "event_loop", label: "Event Loop", keywords: ["event loop", "microtask"] },
    { key: "memory", label: "Memory Behavior", keywords: ["memory", "leak", "gc"] },
  ],
  nodejs: [
    { key: "event_loop", label: "Event Loop", keywords: ["event loop", "timers"] },
    { key: "async_patterns", label: "Async Patterns", keywords: ["async", "promise", "callback"] },
    {
      key: "performance_debugging",
      label: "Performance Debugging",
      keywords: ["performance", "profiling", "debug"],
    },
    { key: "streams", label: "Streams", keywords: ["stream", "buffer", "backpressure"] },
    { key: "scaling", label: "Scaling", keywords: ["scaling", "cluster", "horizontal"] },
  ],
  system_design: [
    { key: "architecture", label: "Architecture", keywords: ["architecture", "component"] },
    { key: "scalability", label: "Scalability", keywords: ["scale", "throughput", "latency"] },
    { key: "caching", label: "Caching", keywords: ["cache", "redis", "invalidation"] },
    { key: "database_design", label: "Database Design", keywords: ["database", "schema", "index"] },
  ],
  java: [
    { key: "jvm", label: "JVM Internals", keywords: ["jvm", "bytecode", "garbage collection"] },
    {
      key: "concurrency",
      label: "Concurrency",
      keywords: ["thread", "synchronized", "concurrency"],
    },
    {
      key: "memory_management",
      label: "Memory Management",
      keywords: ["heap", "stack", "memory"],
    },
    { key: "collections", label: "Collections", keywords: ["hashmap", "concurrenthashmap", "map"] },
  ],
  c: [
    { key: "pointers", label: "Pointers", keywords: ["pointer", "dereference"] },
    { key: "memory", label: "Memory", keywords: ["heap", "stack", "free", "malloc"] },
    {
      key: "segmentation_faults",
      label: "Segmentation Faults",
      keywords: ["segmentation fault", "segfault"],
    },
    {
      key: "concurrency",
      label: "Concurrency",
      keywords: ["thread", "race condition", "mutex"],
    },
  ],
};

function normalizeTopic(topic: string) {
  const normalized = topic.trim().toLowerCase();
  if (normalized === "node.js" || normalized === "nodejs") {
    return "nodejs";
  }
  if (normalized === "system design" || normalized === "system_design") {
    return "system_design";
  }
  return normalized;
}

export function getTopicSkillMetrics(topic: string) {
  return skillMapping[normalizeTopic(topic)] ?? skillMapping.system_design;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(10, Math.round(value)));
}

export function buildTopicSkillBreakdown(input: {
  topic: string;
  score: number;
  missingConcepts: string[];
  genericSkillBreakdown: SkillBreakdown;
}) {
  const metrics = getTopicSkillMetrics(input.topic);
  const genericValues = [
    input.genericSkillBreakdown.architecture,
    input.genericSkillBreakdown.scalability,
    input.genericSkillBreakdown.dataModeling,
    input.genericSkillBreakdown.caching,
  ];

  return metrics.map((metric, index) => {
    const base = genericValues[index] ?? input.score;
    const penalty = input.missingConcepts.some((concept) =>
      metric.keywords.some((keyword) => concept.toLowerCase().includes(keyword)),
    )
      ? 2
      : 0;

    return {
      key: metric.key,
      label: metric.label,
      score: clampScore(base - penalty),
    };
  });
}

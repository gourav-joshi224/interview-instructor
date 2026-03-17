import type { EvaluationResource } from "@/lib/types";

export const learningResources: Record<string, Record<string, EvaluationResource[]>> = {
  javascript: {
    closures: [
      {
        title: "JavaScript Closures Explained",
        url: "https://javascript.info/closure",
      },
    ],
    prototype: [
      {
        title: "Prototype Inheritance",
        url: "https://javascript.info/prototype-inheritance",
      },
    ],
    async: [
      {
        title: "Event Loop and Async JS",
        url: "https://javascript.info/event-loop",
      },
    ],
    memory: [
      {
        title: "Memory Management in JavaScript",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_Management",
      },
    ],
  },
  nodejs: {
    event_loop: [
      {
        title: "Node.js Event Loop Guide",
        url: "https://nodejs.org/en/docs/guides/event-loop-timers-and-nexttick",
      },
    ],
    streams: [
      {
        title: "Node.js Streams",
        url: "https://nodejs.org/api/stream.html",
      },
    ],
    performance: [
      {
        title: "Node.js Diagnostics",
        url: "https://nodejs.org/en/learn/diagnostics",
      },
    ],
  },
  system_design: {
    architecture: [
      {
        title: "System Design Primer",
        url: "https://github.com/donnemartin/system-design-primer",
      },
    ],
    scalability: [
      {
        title: "AWS Well-Architected Framework",
        url: "https://aws.amazon.com/architecture/well-architected/",
      },
    ],
    caching: [
      {
        title: "Redis Caching Patterns",
        url: "https://redis.io/learn/howtos/solutions/caching",
      },
    ],
    database: [
      {
        title: "Database Indexing Guide",
        url: "https://www.mongodb.com/docs/manual/indexes/",
      },
    ],
  },
  java: {
    jvm: [
      {
        title: "Java Virtual Machine Overview",
        url: "https://docs.oracle.com/javase/specs/",
      },
    ],
    concurrency: [
      {
        title: "Java Concurrency Tutorial",
        url: "https://docs.oracle.com/javase/tutorial/essential/concurrency/",
      },
    ],
    collections: [
      {
        title: "Java Collections Framework",
        url: "https://docs.oracle.com/javase/tutorial/collections/",
      },
    ],
  },
  c: {
    pointers: [
      {
        title: "Pointers in C",
        url: "https://www.geeksforgeeks.org/c-pointers/",
      },
    ],
    memory: [
      {
        title: "Stack vs Heap in C",
        url: "https://www.geeksforgeeks.org/stack-vs-heap-memory-allocation/",
      },
    ],
    segmentation: [
      {
        title: "Segmentation Fault in C",
        url: "https://www.geeksforgeeks.org/segmentation-fault-c-cpp/",
      },
    ],
  },
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

export function mapMissingConceptsToLearningResources(topic: string, missingConcepts: string[]) {
  const topicResources = learningResources[normalizeTopic(topic)] ?? learningResources.system_design;
  const selected: EvaluationResource[] = [];

  const allEntries = Object.entries(topicResources);
  for (const concept of missingConcepts) {
    const lowerConcept = concept.toLowerCase();
    const match = allEntries.find(([key]) => lowerConcept.includes(key.replace("_", " ")));
    const resources = (match ? match[1] : allEntries[0]?.[1]) ?? [];

    for (const resource of resources) {
      if (!selected.find((item) => item.url === resource.url)) {
        selected.push(resource);
      }
      if (selected.length >= 3) {
        return selected;
      }
    }
  }

  if (selected.length > 0) {
    return selected;
  }

  return allEntries[0]?.[1] ?? [];
}

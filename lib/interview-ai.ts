import type {
  DynamicSkillScore,
  EvaluationResource,
  InterviewSessionAnswer,
  SkillBreakdown,
} from "@/lib/types";
import { mapMissingConceptsToLearningResources } from "@/data/learningResources";

const MAX_ANSWER_CHARS = 2400;
const LANGUAGE_TOPICS = new Set(["JavaScript", "Node.js", "Java", "C"]);

export const SUPPORTED_RESUME_SKILLS = [
  "Node.js",
  "JavaScript",
  "System Design",
  "Redis",
  "Caching",
  "Concurrency",
  "Java",
  "C",
] as const;

type RawEvaluation = {
  score?: unknown;
  strengths?: unknown;
  missingConcepts?: unknown;
  explanationForUser?: unknown;
  idealAnswer?: unknown;
  followUpQuestion?: unknown;
  skillBreakdown?: unknown;
  learningResources?: unknown;
};

type RawFinalReport = {
  overallScore?: unknown;
  strengths?: unknown;
  weakAreas?: unknown;
  communicationFeedback?: unknown;
  technicalFeedback?: unknown;
  improvementPlan?: unknown;
  skillBreakdown?: unknown;
};

const TOPIC_SKILLS: Record<string, string[]> = {
  javascript: ["closures", "prototype", "async programming", "memory"],
  "node.js": ["event loop", "streams", "performance", "scaling"],
  "system design": ["architecture", "scalability", "data modeling", "caching"],
  java: ["jvm", "concurrency", "memory management", "collections"],
  c: ["pointers", "memory", "segmentation faults", "concurrency"],
};

const RESOURCE_WHITELIST: Array<{
  match: RegExp;
  resource: EvaluationResource;
}> = [
  {
    match: /closure|prototype|javascript/i,
    resource: {
      title: "JavaScript Guide - Closures",
      url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures",
    },
  },
  {
    match: /async|event loop|promise/i,
    resource: {
      title: "Node.js Event Loop",
      url: "https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick",
    },
  },
  {
    match: /stream/i,
    resource: {
      title: "Node.js Streams",
      url: "https://nodejs.org/api/stream.html",
    },
  },
  {
    match: /performance|scaling|scale/i,
    resource: {
      title: "AWS Well-Architected - Performance Efficiency",
      url: "https://aws.amazon.com/architecture/well-architected/",
    },
  },
  {
    match: /architecture|system design|distributed/i,
    resource: {
      title: "System Design Primer",
      url: "https://github.com/donnemartin/system-design-primer",
    },
  },
  {
    match: /cache|caching|redis/i,
    resource: {
      title: "Redis Caching Patterns",
      url: "https://redis.io/learn/howtos/solutions/caching",
    },
  },
];

export function normalizeInput(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function truncateAnswer(answer: string) {
  const normalized = normalizeInput(answer);
  return normalized.length <= MAX_ANSWER_CHARS
    ? normalized
    : `${normalized.slice(0, MAX_ANSWER_CHARS)}...`;
}

export function buildQuestionPrompt(input: {
  topic: string;
  experience: string;
  difficulty: string;
}) {
  return [
    "You are a senior backend engineer conducting a realistic interview.",
    "",
    "Candidate:",
    `Experience: ${input.experience}`,
    `Difficulty: ${input.difficulty}`,
    `Topic: ${input.topic}`,
    "",
    "Rules:",
    "- Ask ONE practical backend interview question.",
    "- Prefer real-world scenario questions.",
    "- Keep question under 40 words.",
    "- Do not include explanation.",
    "",
    "Return JSON:",
    "",
    '{ "question": "..." }',
  ].join("\n");
}

export function isLanguageTopic(topic: string) {
  return LANGUAGE_TOPICS.has(topic);
}

export function buildLanguageQuestionPrompt(input: {
  language: string;
  experience: string;
}) {
  return [
    "You are a programming interviewer.",
    "",
    `Language: ${input.language}`,
    `Experience: ${input.experience}`,
    "",
    "Ask one technical interview question that tests programming knowledge.",
    "",
    "Examples:",
    "- async programming",
    "- memory management",
    "- concurrency",
    "- language internals",
    "",
    "Keep question under 40 words.",
    "",
    "Return JSON:",
    '{ "question": "" }',
  ].join("\n");
}

export function buildLanguageEnhancementPrompt(input: {
  language: string;
  experience: string;
  difficulty: string;
  question: string;
}) {
  return [
    "You are a programming language interviewer.",
    "",
    `Language: ${input.language}`,
    `Experience: ${input.experience}`,
    `Difficulty: ${input.difficulty}`,
    "",
    "Base question:",
    input.question,
    "",
    "Improve the question slightly for realism.",
    "",
    "Rules:",
    "- keep the same concept",
    "- avoid algorithm questions unless explicitly required",
    "- keep question under 40 words",
    "",
    "Return JSON:",
    "",
    '{ "question": "" }',
  ].join("\n");
}

export function buildBackendEnhancementPrompt(input: {
  topic: string;
  experience: string;
  difficulty: string;
  question: string;
}) {
  return [
    "You are a backend interviewer.",
    "",
    `Topic: ${input.topic}`,
    `Experience: ${input.experience}`,
    `Difficulty: ${input.difficulty}`,
    "",
    "Base question:",
    input.question,
    "",
    "Improve the question slightly for realism.",
    "",
    "Rules:",
    "- keep the same concept",
    "- keep question under 40 words",
    "- may add practical scenario context",
    "",
    "Return JSON:",
    "",
    '{ "question": "" }',
  ].join("\n");
}

export function buildResumeSkillExtractionPrompt(resumeText: string) {
  return [
    "Extract backend-relevant skills from this resume.",
    "Return JSON only.",
    '{ "skills": [""] }',
    "Resume text:",
    resumeText.slice(0, 10000),
  ].join("\n\n");
}

function normalizeSkill(value: string) {
  const compact = value.replace(/\s+/g, " ").trim().toLowerCase();
  const matched = SUPPORTED_RESUME_SKILLS.find(
    (supported) => supported.toLowerCase() === compact,
  );
  return matched ?? null;
}

export function filterSupportedSkills(skills: string[]) {
  const deduped = new Set<string>();

  for (const skill of skills) {
    const normalized = normalizeSkill(skill);
    if (normalized) {
      deduped.add(normalized);
    }
  }

  return [...deduped];
}

export function buildResumeQuestionPrompt(input: { skills: string[] }) {
  return [
    "You are a backend interviewer.",
    "",
    "Candidate skills:",
    input.skills.join(", "),
    "",
    "Choose ONE skill and ask an interview question related to it.",
    "",
    "Rules:",
    "- prefer backend topics",
    "- avoid frontend topics",
    "- keep question under 40 words",
    "",
    "Return JSON:",
    '{ "question": "", "skill": "" }',
  ].join("\n");
}

export function buildEvaluationPrompt(input: {
  topic: string;
  question: string;
  answer: string;
}) {
  return [
    "You are a backend technical interviewer.",
    "",
    "Your job:",
    "Evaluate backend interview answers.",
    "",
    "Be educational and constructive.",
    "",
    "Return JSON with fields:",
    "score",
    "strengths",
    "missingConcepts",
    "explanationForUser",
    "idealAnswer",
    "followUpQuestion",
    "skillBreakdown",
    "",
    "Also generate:",
    "idealAnswer:",
    "Rewrite the candidate's answer in a strong interview style.",
    "Explain the correct approach clearly.",
    "Keep it under 150 words.",
    "",
    "Use short explanations (max 120 words).",
    "Do not return learningResources URLs.",
    "Return only analysis fields. Backend will map resources.",
    "",
    `Topic: ${normalizeInput(input.topic)}`,
    `Question: ${normalizeInput(input.question)}`,
    `Answer: ${truncateAnswer(input.answer)}`,
    "",
    "Return JSON only.",
    '{"score":0,"strengths":[""],"missingConcepts":[""],"explanationForUser":"","idealAnswer":"","followUpQuestion":"","skillBreakdown":{"architecture":0,"scalability":0,"dataModeling":0,"caching":0}}',
    "",
    "Rules:",
    "- score: integer 0-10",
    "- strengths: 2-3 short items",
    "- missingConcepts: 2-3 short items",
    "- explanationForUser: <= 120 words",
    "- idealAnswer: Rewrite the candidate answer in strong interview style; clear correct approach; <= 150 words",
    "- idealAnswer must be plain text only, one paragraph, no code block, no markdown, no backticks",
    "- followUpQuestion: one practical follow-up question",
    "- skillBreakdown: integer 0-10 for architecture, scalability, dataModeling, caching",
  ].join("\n");
}

export function getTopicSkillCategories(topic: string) {
  const key = topic.trim().toLowerCase();
  return TOPIC_SKILLS[key] ?? ["architecture", "scalability", "data modeling", "caching"];
}

export function buildFinalSessionAnalysisPrompt(input: {
  topic: string;
  experience: string;
  difficulty: string;
  answers: InterviewSessionAnswer[];
  skillCategories: string[];
}) {
  const transcript = input.answers
    .map(
      (item, index) =>
        `Q${index + 1}: ${normalizeInput(item.question)}\nA${index + 1}: ${truncateAnswer(item.answer)}`,
    )
    .join("\n\n");

  return [
    "You are a senior technical interviewer.",
    "",
    "Analyze this full interview session and provide final feedback.",
    "",
    `Topic: ${input.topic}`,
    `Experience: ${input.experience}`,
    `Difficulty: ${input.difficulty}`,
    `Skill categories: ${input.skillCategories.join(", ")}`,
    "",
    "Interview transcript:",
    transcript,
    "",
    "Return JSON only with fields:",
    "overallScore",
    "strengths",
    "weakAreas",
    "communicationFeedback",
    "technicalFeedback",
    "improvementPlan",
    "skillBreakdown",
    "",
    "Rules:",
    "- overallScore: integer 0-100",
    "- strengths: 3 short items",
    "- weakAreas: 3 short items",
    "- communicationFeedback: <= 100 words",
    "- technicalFeedback: <= 120 words",
    "- improvementPlan: <= 120 words",
    "- skillBreakdown: object with only provided skill categories, integer scores 0-10",
    "",
    '{"overallScore":0,"strengths":[""],"weakAreas":[""],"communicationFeedback":"","technicalFeedback":"","improvementPlan":"","skillBreakdown":{"category":0}}',
  ].join("\n");
}

function toText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function tryRepairJson(value: string) {
  return value
    .replace(/([{,]\s*)'([^']+?)'\s*:/g, '$1"$2":')
    .replace(/:\s*'([^']*?)'(\s*[,}])/g, ': "$1"$2')
    .replace(/,\s*([}\]])/g, "$1");
}

export function parseJsonObject(value: string) {
  const trimmed = value.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model did not return valid JSON.");
  }

  const payload = candidate.slice(start, end + 1);

  try {
    return JSON.parse(payload) as RawEvaluation;
  } catch {
    return JSON.parse(tryRepairJson(payload)) as RawEvaluation;
  }
}

function toStringList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, 3);

  return items.length > 0 ? items : fallback;
}

function toSkillScores(value: unknown, categories: string[]): DynamicSkillScore[] {
  const fallback = categories.map((skill) => ({ skill, score: 5 }));

  if (!value || typeof value !== "object") {
    return fallback;
  }

  return categories.map((skill) => {
    const raw = skill in value ? (value as Record<string, unknown>)[skill] : 5;
    const numeric =
      typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : 5;

    return {
      skill,
      score: Math.max(0, Math.min(10, Math.round(Number.isFinite(numeric) ? numeric : 5))),
    };
  });
}

function toLearningResourcesFromWeakAreas(weakAreas: string[]): EvaluationResource[] {
  const resources: EvaluationResource[] = [];

  for (const area of weakAreas) {
    const matched = RESOURCE_WHITELIST.find((item) => item.match.test(area));
    if (matched && !resources.find((resource) => resource.url === matched.resource.url)) {
      resources.push(matched.resource);
    }
  }

  if (resources.length > 0) {
    return resources.slice(0, 3);
  }

  return [
    {
      title: "System Design Primer",
      url: "https://github.com/donnemartin/system-design-primer",
    },
    {
      title: "Node.js Learn",
      url: "https://nodejs.org/en/learn",
    },
  ];
}

function normalizeSkillValue(value: unknown) {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : 0;

  return Math.max(0, Math.min(10, Math.round(Number.isFinite(numeric) ? numeric : 0)));
}

function toSkillBreakdown(value: unknown): SkillBreakdown {
  const fallback = {
    architecture: 5,
    scalability: 5,
    dataModeling: 5,
    caching: 5,
  };

  if (!value || typeof value !== "object") {
    return fallback;
  }

  return {
    architecture:
      "architecture" in value ? normalizeSkillValue(value.architecture) : fallback.architecture,
    scalability:
      "scalability" in value ? normalizeSkillValue(value.scalability) : fallback.scalability,
    dataModeling:
      "dataModeling" in value
        ? normalizeSkillValue(value.dataModeling)
        : fallback.dataModeling,
    caching: "caching" in value ? normalizeSkillValue(value.caching) : fallback.caching,
  };
}

export function normalizeEvaluation(raw: RawEvaluation, topic: string) {
  const score =
    typeof raw.score === "number"
      ? raw.score
      : typeof raw.score === "string"
        ? Number(raw.score)
        : 0;

  return {
    score: Math.max(0, Math.min(10, Math.round(Number.isFinite(score) ? score : 0))),
    strengths: toStringList(raw.strengths, [
      "Clear effort shown, but the response needs more structured depth.",
    ]),
    missingConcepts: toStringList(raw.missingConcepts, [
      "Call out tradeoffs, edge cases, and failure handling more explicitly.",
    ]),
    explanationForUser: toText(
      raw.explanationForUser,
      "Organize the answer around architecture, tradeoffs, failure modes, and operational concerns.",
    ),
    idealAnswer: toText(
      raw.idealAnswer,
      "A strong answer should clearly define architecture, data model, cache strategy, async workflows, and operational tradeoffs with concise justifications.",
    ),
    followUpQuestion: toText(
      raw.followUpQuestion,
      "How would you evolve this design if traffic grows 10x and some dependencies begin to fail?",
    ),
    skillBreakdown: toSkillBreakdown(raw.skillBreakdown),
    learningResources: mapMissingConceptsToLearningResources(
      topic,
      toStringList(raw.missingConcepts, [
        "Call out tradeoffs, edge cases, and failure handling more explicitly.",
      ]),
    ),
  };
}

export function normalizeFinalSessionReport(
  raw: RawFinalReport,
  skillCategories: string[],
) {
  const overall =
    typeof raw.overallScore === "number"
      ? raw.overallScore
      : typeof raw.overallScore === "string"
        ? Number(raw.overallScore)
        : 0;

  const strengths = toStringList(raw.strengths, [
    "Good effort and structure under interview pressure.",
  ]);
  const weakAreas = toStringList(raw.weakAreas, [
    "Go deeper into tradeoffs and failure scenarios.",
  ]);

  return {
    overallScore: Math.max(0, Math.min(100, Math.round(Number.isFinite(overall) ? overall : 0))),
    strengths,
    weakAreas,
    communicationFeedback: toText(
      raw.communicationFeedback,
      "Make your answers more structured by covering context, approach, tradeoffs, and risks in order.",
    ),
    technicalFeedback: toText(
      raw.technicalFeedback,
      "Include deeper detail on internal behavior, scalability decisions, and concrete failure handling.",
    ),
    improvementPlan: toText(
      raw.improvementPlan,
      "Practice concise architecture walkthroughs and add one clear tradeoff discussion per answer.",
    ),
    skillBreakdown: toSkillScores(raw.skillBreakdown, skillCategories),
    learningResources: toLearningResourcesFromWeakAreas(weakAreas),
  };
}

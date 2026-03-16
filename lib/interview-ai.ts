import type { EvaluationResource, SkillBreakdown } from "@/lib/types";

const MAX_ANSWER_CHARS = 2400;

type RawEvaluation = {
  score?: unknown;
  strengths?: unknown;
  missingConcepts?: unknown;
  explanationForUser?: unknown;
  followUpQuestion?: unknown;
  skillBreakdown?: unknown;
  learningResources?: unknown;
};

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

export function buildEvaluationPrompt(input: {
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
    "followUpQuestion",
    "skillBreakdown",
    "learningResources",
    "",
    "Use short explanations (max 120 words).",
    "Use only trusted links:",
    "redis.io",
    "nodejs.org",
    "aws.amazon.com",
    "bytebytego.com",
    "systemdesignprimer",
    "",
    `Question: ${normalizeInput(input.question)}`,
    `Answer: ${truncateAnswer(input.answer)}`,
    "",
    "Return JSON only.",
    '{"score":0,"strengths":[""],"missingConcepts":[""],"explanationForUser":"","followUpQuestion":"","skillBreakdown":{"architecture":0,"scalability":0,"dataModeling":0,"caching":0},"learningResources":[{"title":"","url":""}]}',
    "",
    "Rules:",
    "- score: integer 0-10",
    "- strengths: 2-3 short items",
    "- missingConcepts: 2-3 short items",
    "- explanationForUser: <= 120 words",
    "- followUpQuestion: one practical follow-up question",
    "- skillBreakdown: integer 0-10 for architecture, scalability, dataModeling, caching",
    "- learningResources: exactly 2 items with valid article URLs from trusted domains only",
  ].join("\n");
}

function toText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
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

  return JSON.parse(candidate.slice(start, end + 1)) as RawEvaluation;
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

function toResources(value: unknown): EvaluationResource[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const title = "title" in item && typeof item.title === "string" ? item.title.trim() : "";
      const url = "url" in item && typeof item.url === "string" ? item.url.trim() : "";

      if (
        !title ||
        !/^https?:\/\//.test(url) ||
        !/(redis\.io|nodejs\.org|aws\.amazon\.com|bytebytego\.com|systemdesignprimer)/i.test(
          url,
        )
      ) {
        return null;
      }

      return { title, url };
    })
    .filter((item): item is EvaluationResource => Boolean(item))
    .slice(0, 2);
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

export function normalizeEvaluation(raw: RawEvaluation) {
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
    followUpQuestion: toText(
      raw.followUpQuestion,
      "How would you evolve this design if traffic grows 10x and some dependencies begin to fail?",
    ),
    skillBreakdown: toSkillBreakdown(raw.skillBreakdown),
    learningResources:
      toResources(raw.learningResources).length > 0
        ? toResources(raw.learningResources)
        : [
            {
              title: "Redis caching patterns",
              url: "https://redis.io/learn/howtos/solutions/caching",
            },
            {
              title: "System design fundamentals",
              url: "https://github.com/donnemartin/system-design-primer",
            },
          ],
  };
}

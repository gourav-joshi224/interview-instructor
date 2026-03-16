import type { EvaluationResult, SkillBreakdown, StoredInterviewResult } from "@/lib/types";

type SaveInterviewInput = {
  topic: string;
  experience: string;
  difficulty: string;
  question: string;
  answer: string;
} & EvaluationResult;

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { booleanValue: boolean }
  | { timestampValue: string }
  | { mapValue: { fields: Record<string, FirestoreValue> } }
  | { arrayValue: { values: FirestoreValue[] } };

type FirestoreDocument = {
  name?: string;
  fields?: Record<string, FirestoreValue>;
};

function getFirebaseConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (!apiKey || !projectId) {
    return null;
  }

  return { apiKey, projectId };
}

function stringField(value: string): FirestoreValue {
  return { stringValue: value };
}

function integerField(value: number): FirestoreValue {
  return { integerValue: String(value) };
}

function booleanField(value: boolean): FirestoreValue {
  return { booleanValue: value };
}

function timestampField(value: string): FirestoreValue {
  return { timestampValue: value };
}

function arrayField(values: string[]): FirestoreValue {
  return {
    arrayValue: {
      values: values.map(stringField),
    },
  };
}

function resourceArrayField(
  values: Array<{
    title: string;
    url: string;
  }>,
): FirestoreValue {
  return {
    arrayValue: {
      values: values.map((value) => ({
        mapValue: {
          fields: {
            title: stringField(value.title),
            url: stringField(value.url),
          },
        },
      })),
    },
  };
}

function skillBreakdownField(value: SkillBreakdown): FirestoreValue {
  return {
    mapValue: {
      fields: {
        architecture: integerField(value.architecture),
        scalability: integerField(value.scalability),
        dataModeling: integerField(value.dataModeling),
        caching: integerField(value.caching),
      },
    },
  };
}

function documentUrl(path: string, apiKey: string, projectId: string) {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}?key=${apiKey}`;
}

function collectionUrl(path: string, apiKey: string, projectId: string) {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}?key=${apiKey}`;
}

function runQueryUrl(apiKey: string, projectId: string) {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`;
}

function readString(value: FirestoreValue | undefined) {
  return value && "stringValue" in value ? value.stringValue : "";
}

function readNumber(value: FirestoreValue | undefined) {
  if (!value || !("integerValue" in value)) {
    return 0;
  }

  return Number(value.integerValue) || 0;
}

function readBoolean(value: FirestoreValue | undefined) {
  return Boolean(value && "booleanValue" in value ? value.booleanValue : false);
}

function readStringArray(value: FirestoreValue | undefined) {
  if (!value || !("arrayValue" in value)) {
    return [];
  }

  return (value.arrayValue.values ?? [])
    .map((item) => ("stringValue" in item ? item.stringValue : ""))
    .filter(Boolean);
}

function readResources(value: FirestoreValue | undefined) {
  if (!value || !("arrayValue" in value)) {
    return [];
  }

  return (value.arrayValue.values ?? [])
    .map((item) => {
      if (!("mapValue" in item)) {
        return null;
      }

      return {
        title: readString(item.mapValue.fields.title),
        url: readString(item.mapValue.fields.url),
      };
    })
    .filter((item): item is { title: string; url: string } => Boolean(item?.title && item?.url));
}

function readSkillBreakdown(value: FirestoreValue | undefined): SkillBreakdown {
  if (!value || !("mapValue" in value)) {
    return {
      architecture: 0,
      scalability: 0,
      dataModeling: 0,
      caching: 0,
    };
  }

  const fields = value.mapValue.fields;

  return {
    architecture: readNumber(fields.architecture),
    scalability: readNumber(fields.scalability),
    dataModeling: readNumber(fields.dataModeling),
    caching: readNumber(fields.caching),
  };
}

function parseInterviewDocument(document: FirestoreDocument): StoredInterviewResult | null {
  const fields = document.fields;

  if (!fields) {
    return null;
  }

  return {
    interviewId: document.name?.split("/").pop(),
    topic: readString(fields.topic),
    experience: readString(fields.experience),
    difficulty: readString(fields.difficulty),
    question: readString(fields.question),
    answer: readString(fields.answer),
    score: readNumber(fields.score),
    strengths: readStringArray(fields.strengths),
    missingConcepts: readStringArray(fields.missingConcepts),
    explanationForUser: readString(fields.explanationForUser),
    followUpQuestion: readString(fields.followUpQuestion),
    skillBreakdown: readSkillBreakdown(fields.skillBreakdown),
    learningResources: readResources(fields.learningResources),
    cached: readBoolean(fields.cached),
  };
}

function parseCachedEvaluation(document: FirestoreDocument): EvaluationResult | null {
  const interview = parseInterviewDocument(document);

  if (!interview) {
    return null;
  }

  return {
    interviewId: interview.interviewId,
    score: interview.score,
    strengths: interview.strengths,
    missingConcepts: interview.missingConcepts,
    explanationForUser: interview.explanationForUser,
    followUpQuestion: interview.followUpQuestion,
    skillBreakdown: interview.skillBreakdown,
    learningResources: interview.learningResources,
    cached: true,
  };
}

function buildStoredFields(input: SaveInterviewInput) {
  return {
    topic: stringField(input.topic),
    experience: stringField(input.experience),
    difficulty: stringField(input.difficulty),
    question: stringField(input.question),
    answer: stringField(input.answer),
    score: integerField(input.score),
    strengths: arrayField(input.strengths),
    missingConcepts: arrayField(input.missingConcepts),
    explanationForUser: stringField(input.explanationForUser),
    followUpQuestion: stringField(input.followUpQuestion),
    skillBreakdown: skillBreakdownField(input.skillBreakdown),
    learningResources: resourceArrayField(input.learningResources),
    cached: booleanField(Boolean(input.cached)),
    createdAt: timestampField(new Date().toISOString()),
  };
}

export async function saveInterview(input: SaveInterviewInput) {
  const config = getFirebaseConfig();

  if (!config) {
    return null;
  }

  const response = await fetch(
    collectionUrl("interviews", config.apiKey, config.projectId),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: buildStoredFields(input),
      }),
    },
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Failed to save interview: ${details}`);
  }

  const data = (await response.json()) as { name?: string };
  return data.name?.split("/").pop() ?? null;
}

export async function getCachedEvaluation(cacheKey: string) {
  const config = getFirebaseConfig();

  if (!config) {
    return null;
  }

  const response = await fetch(documentUrl(`aiCache/${cacheKey}`, config.apiKey, config.projectId), {
    method: "GET",
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Failed to read AI cache: ${details}`);
  }

  return parseCachedEvaluation((await response.json()) as FirestoreDocument);
}

export async function saveCachedEvaluation(
  cacheKey: string,
  input: SaveInterviewInput,
) {
  const config = getFirebaseConfig();

  if (!config) {
    return;
  }

  const response = await fetch(documentUrl(`aiCache/${cacheKey}`, config.apiKey, config.projectId), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: buildStoredFields({
        ...input,
        cached: true,
      }),
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Failed to save AI cache: ${details}`);
  }
}

export async function getRecentInterviews(limit = 20) {
  const config = getFirebaseConfig();

  if (!config) {
    return [];
  }

  const response = await fetch(runQueryUrl(config.apiKey, config.projectId), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: "interviews" }],
        orderBy: [
          {
            field: { fieldPath: "createdAt" },
            direction: "DESCENDING",
          },
        ],
        limit,
      },
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Failed to fetch interview history: ${details}`);
  }

  const data = (await response.json()) as Array<{ document?: FirestoreDocument }>;

  return data
    .map((item) => (item.document ? parseInterviewDocument(item.document) : null))
    .filter((item): item is StoredInterviewResult => Boolean(item));
}

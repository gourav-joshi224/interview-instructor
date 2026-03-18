import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type SkillBreakdown = {
  architecture: number;
  scalability: number;
  dataModeling: number;
  caching: number;
};

type EvaluationResource = {
  title: string;
  url: string;
};

type EvaluationResult = {
  score: number;
  strengths: string[];
  missingConcepts: string[];
  explanationForUser: string;
  idealAnswer: string;
  followUpQuestion: string;
  skillBreakdown: SkillBreakdown;
  learningResources: EvaluationResource[];
};

type SessionStatus = 'in_progress' | 'completed';

type InterviewSessionAnswer = {
  question: string;
  answer: string;
};

type DynamicSkillScore = {
  skill: string;
  score: number;
};

type InterviewFinalReport = {
  overallScore: number;
  strengths: string[];
  weakAreas: string[];
  communicationFeedback: string;
  technicalFeedback: string;
  improvementPlan: string;
  skillBreakdown: DynamicSkillScore[];
  learningResources: EvaluationResource[];
};

type SaveInterviewInput = {
  topic: string;
  experience: string;
  difficulty: string;
  mode?: string;
  selectedSkill?: string;
  question: string;
  answer: string;
} & EvaluationResult & {
    cached?: boolean;
  };

type SaveInterviewSessionInput = {
  topic: string;
  experience: string;
  difficulty: string;
  totalQuestions: number;
  answers: InterviewSessionAnswer[];
  status: SessionStatus;
  report?: InterviewFinalReport | null;
};

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

type FirestoreFields = Record<string, FirestoreValue>;

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly configService: ConfigService) {}

  async saveInterview(input: SaveInterviewInput): Promise<string | null> {
    const config = this.getFirebaseConfig();
    if (!config) {
      return null;
    }

    const response = await fetch(this.collectionUrl('interviews', config.apiKey, config.projectId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields: this.buildStoredFields(input) }),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Failed to save interview: ${details}`);
    }

    const payload = (await response.json()) as { name?: string };
    return payload.name?.split('/').pop() ?? null;
  }

  async getRecentInterviews(limit = 20): Promise<Array<Record<string, unknown>>> {
    const config = this.getFirebaseConfig();
    if (!config) {
      return [];
    }

    const response = await fetch(this.runQueryUrl(config.apiKey, config.projectId), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'interviews' }],
          orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
          limit,
        },
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Failed to fetch interview history: ${details}`);
    }

    const payload = (await response.json()) as Array<{ document?: FirestoreDocument }>;

    return payload
      .map((item) => (item.document ? this.parseInterviewDocument(item.document) : null))
      .filter((item): item is Record<string, unknown> => Boolean(item));
  }

  async createInterviewSession(input: SaveInterviewSessionInput): Promise<string> {
    const config = this.getFirebaseConfig();
    if (!config) {
      // Stable mock fallback keeps frontend flow alive.
      return `mock-${Date.now()}`;
    }

    const response = await fetch(
      this.collectionUrl('interviewSessions', config.apiKey, config.projectId),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: this.buildSessionFields(input),
        }),
      },
    );

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Failed to create interview session: ${details}`);
    }

    const payload = (await response.json()) as { name?: string };
    const sessionId = payload.name?.split('/').pop();

    if (!sessionId) {
      throw new Error('Failed to parse created session id.');
    }

    return sessionId;
  }

  async updateInterviewSession(sessionId: string, input: SaveInterviewSessionInput): Promise<void> {
    const config = this.getFirebaseConfig();
    if (!config) {
      return;
    }

    const response = await fetch(
      this.documentUrl(`interviewSessions/${sessionId}`, config.apiKey, config.projectId),
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: this.buildSessionFields(input),
        }),
      },
    );

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Failed to update interview session: ${details}`);
    }
  }

  async getInterviewSession(sessionId: string): Promise<Record<string, unknown> | null> {
    const config = this.getFirebaseConfig();
    if (!config) {
      return {
        sessionId,
        topic: 'System Design',
        experience: 'mid-level',
        difficulty: 'medium',
        totalQuestions: 5,
        answers: [],
        status: 'in_progress',
        report: null,
      };
    }

    const response = await fetch(
      this.documentUrl(`interviewSessions/${sessionId}`, config.apiKey, config.projectId),
      {
        method: 'GET',
      },
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Failed to fetch interview session: ${details}`);
    }

    const document = (await response.json()) as FirestoreDocument;
    return this.parseSessionDocument(document);
  }

  private getFirebaseConfig() {
    const apiKey = this.configService.get<string>('firebase.apiKey', '');
    const projectId = this.configService.get<string>('firebase.projectId', '');

    if (!apiKey || !projectId) {
      this.logger.warn('Firebase env missing. Falling back to non-persistent mode.');
      return null;
    }

    const apiKeyLooksValid = /^AIza[0-9A-Za-z_-]{20,}$/.test(apiKey);
    const projectIdLooksValid = /^[a-z][a-z0-9-]{4,}$/.test(projectId);
    const valuesLookSwapped = !apiKeyLooksValid && /^AIza[0-9A-Za-z_-]{20,}$/.test(projectId);

    if (valuesLookSwapped) {
      this.logger.error(
        'Firebase env appears swapped: FIREBASE_API_KEY should be the AIza... key and FIREBASE_PROJECT_ID should be the project id (e.g. interview-gym). Falling back to non-persistent mode.',
      );
      return null;
    }

    if (!apiKeyLooksValid || !projectIdLooksValid) {
      this.logger.warn(
        'Firebase env format looks invalid. Check FIREBASE_API_KEY and FIREBASE_PROJECT_ID. Falling back to non-persistent mode.',
      );
      return null;
    }

    return { apiKey, projectId };
  }

  private stringField(value: string): FirestoreValue {
    return { stringValue: value };
  }

  private integerField(value: number): FirestoreValue {
    return { integerValue: String(value) };
  }

  private booleanField(value: boolean): FirestoreValue {
    return { booleanValue: value };
  }

  private timestampField(value: string): FirestoreValue {
    return { timestampValue: value };
  }

  private arrayField(values: string[]): FirestoreValue {
    return {
      arrayValue: {
        values: values.map((value) => this.stringField(value)),
      },
    };
  }

  private resourceArrayField(values: EvaluationResource[]): FirestoreValue {
    return {
      arrayValue: {
        values: values.map((value) => ({
          mapValue: {
            fields: {
              title: this.stringField(value.title),
              url: this.stringField(value.url),
            },
          },
        })),
      },
    };
  }

  private answersArrayField(values: InterviewSessionAnswer[]): FirestoreValue {
    return {
      arrayValue: {
        values: values.map((value) => ({
          mapValue: {
            fields: {
              question: this.stringField(value.question),
              answer: this.stringField(value.answer),
            },
          },
        })),
      },
    };
  }

  private dynamicSkillBreakdownField(values: DynamicSkillScore[]): FirestoreValue {
    return {
      arrayValue: {
        values: values.map((value) => ({
          mapValue: {
            fields: {
              skill: this.stringField(value.skill),
              score: this.integerField(value.score),
            },
          },
        })),
      },
    };
  }

  private skillBreakdownField(value: SkillBreakdown): FirestoreValue {
    return {
      mapValue: {
        fields: {
          architecture: this.integerField(value.architecture),
          scalability: this.integerField(value.scalability),
          dataModeling: this.integerField(value.dataModeling),
          caching: this.integerField(value.caching),
        },
      },
    };
  }

  private documentUrl(path: string, apiKey: string, projectId: string) {
    return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}?key=${apiKey}`;
  }

  private collectionUrl(path: string, apiKey: string, projectId: string) {
    return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}?key=${apiKey}`;
  }

  private runQueryUrl(apiKey: string, projectId: string) {
    return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`;
  }

  private readString(value: FirestoreValue | undefined) {
    return value && 'stringValue' in value ? value.stringValue : '';
  }

  private readMapFields(value: FirestoreValue | undefined): FirestoreFields {
    if (!value || !('mapValue' in value)) {
      return {};
    }

    return value.mapValue.fields ?? {};
  }

  private readNumber(value: FirestoreValue | undefined) {
    if (!value || !('integerValue' in value)) {
      return 0;
    }

    return Number(value.integerValue) || 0;
  }

  private readBoolean(value: FirestoreValue | undefined) {
    return Boolean(value && 'booleanValue' in value ? value.booleanValue : false);
  }

  private readStringArray(value: FirestoreValue | undefined) {
    if (!value || !('arrayValue' in value)) {
      return [];
    }

    return (value.arrayValue.values ?? [])
      .map((item) => ('stringValue' in item ? item.stringValue : ''))
      .filter(Boolean);
  }

  private readAnswers(value: FirestoreValue | undefined): InterviewSessionAnswer[] {
    if (!value || !('arrayValue' in value)) {
      return [];
    }

    return (value.arrayValue.values ?? [])
      .map((item) => {
        if (!('mapValue' in item)) {
          return null;
        }

        const fields = item.mapValue.fields ?? {};

        return {
          question: this.readString(fields.question),
          answer: this.readString(fields.answer),
        };
      })
      .filter((item): item is InterviewSessionAnswer => Boolean(item?.question));
  }

  private readDynamicSkillBreakdown(value: FirestoreValue | undefined): DynamicSkillScore[] {
    if (!value || !('arrayValue' in value)) {
      return [];
    }

    return (value.arrayValue.values ?? [])
      .map((item) => {
        if (!('mapValue' in item)) {
          return null;
        }

        const fields = item.mapValue.fields ?? {};

        return {
          skill: this.readString(fields.skill),
          score: this.readNumber(fields.score),
        };
      })
      .filter((item): item is DynamicSkillScore => Boolean(item?.skill));
  }

  private readResources(value: FirestoreValue | undefined): EvaluationResource[] {
    if (!value || !('arrayValue' in value)) {
      return [];
    }

    return (value.arrayValue.values ?? [])
      .map((item) => {
        if (!('mapValue' in item)) {
          return null;
        }

        const fields = item.mapValue.fields ?? {};

        return {
          title: this.readString(fields.title),
          url: this.readString(fields.url),
        };
      })
      .filter((item): item is EvaluationResource => Boolean(item?.title && item?.url));
  }

  private readSkillBreakdown(value: FirestoreValue | undefined): SkillBreakdown {
    if (!value || !('mapValue' in value)) {
      return {
        architecture: 0,
        scalability: 0,
        dataModeling: 0,
        caching: 0,
      };
    }

    const fields = value.mapValue.fields ?? {};

    return {
      architecture: this.readNumber(fields.architecture),
      scalability: this.readNumber(fields.scalability),
      dataModeling: this.readNumber(fields.dataModeling),
      caching: this.readNumber(fields.caching),
    };
  }

  private parseInterviewDocument(document: FirestoreDocument): Record<string, unknown> | null {
    const fields = document.fields;
    if (!fields) {
      return null;
    }

    return {
      interviewId: document.name?.split('/').pop(),
      topic: this.readString(fields.topic),
      experience: this.readString(fields.experience),
      difficulty: this.readString(fields.difficulty),
      question: this.readString(fields.question),
      answer: this.readString(fields.answer),
      mode: this.readString(fields.mode) === 'resume' ? 'resume' : 'standard',
      selectedSkill: this.readString(fields.selectedSkill),
      score: this.readNumber(fields.score),
      strengths: this.readStringArray(fields.strengths),
      missingConcepts: this.readStringArray(fields.missingConcepts),
      explanationForUser: this.readString(fields.explanationForUser),
      idealAnswer: this.readString(fields.idealAnswer),
      followUpQuestion: this.readString(fields.followUpQuestion),
      skillBreakdown: this.readSkillBreakdown(fields.skillBreakdown),
      learningResources: this.readResources(fields.learningResources),
      cached: this.readBoolean(fields.cached),
    };
  }

  private parseSessionDocument(document: FirestoreDocument): Record<string, unknown> | null {
    const fields = document.fields;
    if (!fields) {
      return null;
    }

    const reportValue = fields.report;
    const reportFields = this.readMapFields(reportValue);
    const report =
      Object.keys(reportFields).length > 0
        ? {
            overallScore: this.readNumber(reportFields.overallScore),
            strengths: this.readStringArray(reportFields.strengths),
            weakAreas: this.readStringArray(reportFields.weakAreas),
            communicationFeedback: this.readString(reportFields.communicationFeedback),
            technicalFeedback: this.readString(reportFields.technicalFeedback),
            improvementPlan: this.readString(reportFields.improvementPlan),
            skillBreakdown: this.readDynamicSkillBreakdown(reportFields.skillBreakdown),
            learningResources: this.readResources(reportFields.learningResources),
          }
        : null;

    return {
      sessionId: document.name?.split('/').pop(),
      topic: this.readString(fields.topic),
      experience: this.readString(fields.experience),
      difficulty: this.readString(fields.difficulty),
      totalQuestions: this.readNumber(fields.totalQuestions),
      status: this.readString(fields.status) === 'completed' ? 'completed' : 'in_progress',
      answers: this.readAnswers(fields.answers),
      report,
    };
  }

  private buildStoredFields(input: SaveInterviewInput) {
    return {
      topic: this.stringField(input.topic),
      experience: this.stringField(input.experience),
      difficulty: this.stringField(input.difficulty),
      question: this.stringField(input.question),
      answer: this.stringField(input.answer),
      mode: this.stringField(input.mode ?? 'standard'),
      selectedSkill: this.stringField(input.selectedSkill ?? ''),
      score: this.integerField(input.score),
      strengths: this.arrayField(input.strengths),
      missingConcepts: this.arrayField(input.missingConcepts),
      explanationForUser: this.stringField(input.explanationForUser),
      idealAnswer: this.stringField(input.idealAnswer),
      followUpQuestion: this.stringField(input.followUpQuestion),
      skillBreakdown: this.skillBreakdownField(input.skillBreakdown),
      learningResources: this.resourceArrayField(input.learningResources),
      cached: this.booleanField(Boolean(input.cached)),
      createdAt: this.timestampField(new Date().toISOString()),
    };
  }

  private buildSessionFields(input: SaveInterviewSessionInput): Record<string, FirestoreValue> {
    return {
      topic: this.stringField(input.topic),
      experience: this.stringField(input.experience),
      difficulty: this.stringField(input.difficulty),
      totalQuestions: this.integerField(input.totalQuestions),
      answers: this.answersArrayField(input.answers),
      status: this.stringField(input.status),
      report: {
        mapValue: {
          fields: input.report
            ? {
                overallScore: this.integerField(input.report.overallScore),
                strengths: this.arrayField(input.report.strengths),
                weakAreas: this.arrayField(input.report.weakAreas),
                communicationFeedback: this.stringField(input.report.communicationFeedback),
                technicalFeedback: this.stringField(input.report.technicalFeedback),
                improvementPlan: this.stringField(input.report.improvementPlan),
                skillBreakdown: this.dynamicSkillBreakdownField(input.report.skillBreakdown),
                learningResources: this.resourceArrayField(input.report.learningResources),
              }
            : {},
        },
      },
      updatedAt: this.timestampField(new Date().toISOString()),
    };
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

type SkillBreakdown = {
  architecture: number;
  scalability: number;
  dataModeling: number;
  caching: number;
};

type EvaluationResponse = {
  score: number;
  strengths: string[];
  missingConcepts: string[];
  explanationForUser: string;
  idealAnswer: string;
  followUpQuestion: string;
  skillBreakdown: SkillBreakdown;
  learningResources: Array<{ title: string; url: string }>;
};

type FinalSessionReport = {
  overallScore: number;
  strengths: string[];
  weakAreas: string[];
  communicationFeedback: string;
  technicalFeedback: string;
  improvementPlan: string;
  skillBreakdown: Array<{ skill: string; score: number }>;
  learningResources: Array<{ title: string; url: string }>;
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('xai.apiKey', '');
    const baseURL = this.configService.get<string>('xai.baseUrl', 'https://api.x.ai/v1');
    this.model = this.configService.get<string>('xai.model', 'grok-2-latest');

    this.client = new OpenAI({ apiKey, baseURL });
  }

  async generateQuestion(input: {
    topic: string;
    experience?: string;
    difficulty?: string;
  }): Promise<{ question: string }> {
    const trimmedTopic = input.topic?.trim() || 'Backend Development';

    if (!this.configService.get<string>('xai.apiKey')) {
      this.logger.warn('XAI_API_KEY missing. Returning fallback question.');
      return this.getFallbackQuestion(trimmedTopic);
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: this.questionSystemPrompt(),
          },
          {
            role: 'user',
            content: this.questionUserPrompt({
              topic: trimmedTopic,
              experience: input.experience,
              difficulty: input.difficulty,
            }),
          },
        ],
        temperature: 0.3,
        max_completion_tokens: 160,
      });

      const content = completion.choices[0]?.message?.content?.trim() ?? '';
      const parsed = this.parseJson(content);
      const question = typeof parsed.question === 'string' ? parsed.question.trim() : '';

      if (!question) {
        throw new Error('Model returned empty question.');
      }

      return { question };
    } catch (error) {
      this.logger.error('Question generation failed. Returning fallback.', error instanceof Error ? error.stack : undefined);
      return this.getFallbackQuestion(trimmedTopic);
    }
  }

  async evaluateAnswer(input: {
    topic?: string;
    question: string;
    answer: string;
  }): Promise<EvaluationResponse> {
    const topic = input.topic?.trim() || 'Backend Development';

    if (!this.configService.get<string>('xai.apiKey')) {
      this.logger.warn('XAI_API_KEY missing. Returning fallback evaluation.');
      return this.getFallbackEvaluation(topic, input.question);
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: this.evaluationSystemPrompt(),
          },
          {
            role: 'user',
            content: this.evaluationUserPrompt(input),
          },
        ],
        temperature: 0.1,
        max_completion_tokens: 700,
      });

      const content = completion.choices[0]?.message?.content?.trim() ?? '';
      const parsed = this.parseJson(content);
      return this.normalizeEvaluation(parsed, topic);
    } catch (error) {
      this.logger.error('Answer evaluation failed. Returning fallback.', error instanceof Error ? error.stack : undefined);
      return this.getFallbackEvaluation(topic, input.question);
    }
  }

  async generateFinalSessionReport(input: {
    topic: string;
    experience: string;
    difficulty: string;
    answers: Array<{ question: string; answer: string }>;
  }): Promise<FinalSessionReport> {
    const skillCategories = this.getTopicSkillCategories(input.topic);

    if (!this.configService.get<string>('xai.apiKey')) {
      this.logger.warn('XAI_API_KEY missing. Returning fallback final report.');
      return this.getFallbackFinalReport(skillCategories);
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You are an expert technical interviewer. Return only valid JSON.',
          },
          {
            role: 'user',
            content: this.finalReportUserPrompt({
              ...input,
              skillCategories,
            }),
          },
        ],
        max_completion_tokens: 700,
      });

      const content = completion.choices[0]?.message?.content?.trim() ?? '';
      const parsed = this.parseJson(content);

      return this.normalizeFinalReport(parsed, skillCategories);
    } catch (error) {
      this.logger.error(
        'Final session report generation failed. Returning fallback.',
        error instanceof Error ? error.stack : undefined,
      );
      return this.getFallbackFinalReport(skillCategories);
    }
  }

  private questionSystemPrompt() {
    return 'You are a senior backend interviewer. Return only valid JSON matching the requested schema.';
  }

  private questionUserPrompt(input: { topic: string; experience?: string; difficulty?: string }) {
    return [
      'Generate exactly one backend interview question.',
      `Topic: ${input.topic}`,
      `Experience: ${input.experience?.trim() || 'mid-level'}`,
      `Difficulty: ${input.difficulty?.trim() || 'medium'}`,
      'Rules:',
      '- Keep it practical and realistic.',
      '- Keep question under 40 words.',
      '- Return JSON only.',
      '{"question":""}',
    ].join('\n');
  }

  private evaluationSystemPrompt() {
    return [
      'You are a backend interview evaluator.',
      'Return exactly one JSON object with the required fields only.',
      'No markdown and no code fences.',
    ].join(' ');
  }

  private evaluationUserPrompt(input: { topic?: string; question: string; answer: string }) {
    return [
      `Topic: ${(input.topic ?? 'Backend Development').trim() || 'Backend Development'}`,
      `Question: ${input.question.trim()}`,
      `Answer: ${input.answer.trim().slice(0, 2400)}`,
      'Return JSON with fields:',
      'score, strengths, missingConcepts, explanationForUser, idealAnswer, followUpQuestion, skillBreakdown',
      'Rules:',
      '- score must be integer 0-10',
      '- strengths and missingConcepts should have 2-3 short items',
      '- skillBreakdown must include architecture, scalability, dataModeling, caching as integer 0-10',
      '- do not include learningResources in model output',
    ].join('\n');
  }

  private finalReportUserPrompt(input: {
    topic: string;
    experience: string;
    difficulty: string;
    answers: Array<{ question: string; answer: string }>;
    skillCategories: string[];
  }) {
    const transcript = input.answers
      .map(
        (item, index) =>
          `Q${index + 1}: ${item.question.trim()}\\nA${index + 1}: ${item.answer.trim().slice(0, 1000)}`,
      )
      .join('\\n\\n');

    return [
      `Topic: ${input.topic}`,
      `Experience: ${input.experience}`,
      `Difficulty: ${input.difficulty}`,
      `Skill categories: ${input.skillCategories.join(', ')}`,
      'Interview transcript:',
      transcript,
      'Return JSON with fields:',
      'overallScore, strengths, weakAreas, communicationFeedback, technicalFeedback, improvementPlan, skillBreakdown',
      'Rules:',
      '- overallScore integer 0-100',
      '- strengths and weakAreas 3 short items each',
      '- skillBreakdown object with categories as keys and integer scores 0-10',
      '- do not include markdown',
    ].join('\\n');
  }

  private parseJson(raw: string): Record<string, unknown> {
    const candidate = raw.trim();
    const fenced = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const payload = fenced?.[1]?.trim() ?? candidate;
    const start = payload.indexOf('{');
    const end = payload.lastIndexOf('}');

    if (start < 0 || end <= start) {
      throw new Error('Model did not return a valid JSON object.');
    }

    const json = payload.slice(start, end + 1);
    return JSON.parse(json) as Record<string, unknown>;
  }

  private normalizeEvaluation(raw: Record<string, unknown>, topic: string): EvaluationResponse {
    const numericScore = this.safeNumber(raw.score, 0);
    const missingConcepts = this.toStringList(raw.missingConcepts, [
      'Mention tradeoffs and failure scenarios explicitly.',
    ]);

    return {
      score: Math.max(0, Math.min(10, Math.round(numericScore))),
      strengths: this.toStringList(raw.strengths, [
        'Clear communication and reasonable technical direction.',
      ]),
      missingConcepts,
      explanationForUser: this.toString(raw.explanationForUser, 'Add architecture, tradeoffs, and failure handling details.'),
      idealAnswer: this.toString(
        raw.idealAnswer,
        'A stronger answer should outline architecture choices, data model, scaling path, and resilience tradeoffs in concise steps.',
      ),
      followUpQuestion: this.toString(
        raw.followUpQuestion,
        'How would your approach change if traffic grows 10x and one dependency becomes unreliable?',
      ),
      skillBreakdown: {
        architecture: this.safeNumber((raw.skillBreakdown as Record<string, unknown> | undefined)?.architecture, 5),
        scalability: this.safeNumber((raw.skillBreakdown as Record<string, unknown> | undefined)?.scalability, 5),
        dataModeling: this.safeNumber((raw.skillBreakdown as Record<string, unknown> | undefined)?.dataModeling, 5),
        caching: this.safeNumber((raw.skillBreakdown as Record<string, unknown> | undefined)?.caching, 5),
      },
      learningResources: this.mapLearningResources(topic, missingConcepts),
    };
  }

  private normalizeFinalReport(raw: Record<string, unknown>, skillCategories: string[]): FinalSessionReport {
    const scoreRaw =
      typeof raw.overallScore === 'number'
        ? raw.overallScore
        : typeof raw.overallScore === 'string'
          ? Number(raw.overallScore)
          : 0;
    const score = Math.max(0, Math.min(100, Math.round(Number.isFinite(scoreRaw) ? scoreRaw : 0)));

    const weakAreas = this.toStringList(raw.weakAreas, [
      'Go deeper into tradeoffs and failure handling.',
      'Use clearer scaling strategy justification.',
      'Improve operational detail and observability coverage.',
    ]);

    const skillMap = (raw.skillBreakdown && typeof raw.skillBreakdown === 'object'
      ? raw.skillBreakdown
      : {}) as Record<string, unknown>;

    return {
      overallScore: score,
      strengths: this.toStringList(raw.strengths, [
        'Clear communication under interview pressure.',
        'Good baseline backend reasoning.',
        'Reasonable architecture direction.',
      ]),
      weakAreas,
      communicationFeedback: this.toString(
        raw.communicationFeedback,
        'Structure answers as context, approach, tradeoffs, and failure handling.',
      ),
      technicalFeedback: this.toString(
        raw.technicalFeedback,
        'Increase depth around internal behavior, scalability bottlenecks, and resilience strategy.',
      ),
      improvementPlan: this.toString(
        raw.improvementPlan,
        'Practice concise architecture walkthroughs and include one explicit tradeoff in each answer.',
      ),
      skillBreakdown: skillCategories.map((skill) => ({
        skill,
        score: this.safeNumber(skillMap[skill], 5),
      })),
      learningResources: this.mapLearningResources('System Design', weakAreas),
    };
  }

  private getFallbackQuestion(topic: string): { question: string } {
    return {
      question: `How would you design a scalable ${topic} backend API that handles retries, caching, and observability?`,
    };
  }

  private getFallbackEvaluation(topic: string, question: string): EvaluationResponse {
    const missingConcepts = [
      'Tradeoff analysis between consistency, latency, and complexity.',
      'Failure handling and graceful degradation strategy.',
      'Scalability planning for traffic spikes.',
    ];

    return {
      score: 6,
      strengths: [
        'Attempted a structured answer with relevant backend concepts.',
        'Covered part of the requested design direction.',
      ],
      missingConcepts,
      explanationForUser:
        'You are on the right path. Strengthen your answer by clearly structuring architecture, data flow, and failure handling with explicit tradeoffs.',
      idealAnswer:
        'A strong response would define service boundaries, data model decisions, caching strategy, and resilience patterns such as retries, timeouts, and circuit breakers, then justify tradeoffs for scalability and maintainability.',
      followUpQuestion:
        question.trim() !== ''
          ? `If this ${topic} system receives 10x traffic, what bottleneck would you address first and why?`
          : 'If traffic increases 10x, what bottleneck would you address first and why?',
      skillBreakdown: {
        architecture: 6,
        scalability: 6,
        dataModeling: 5,
        caching: 5,
      },
      learningResources: this.mapLearningResources(topic, missingConcepts),
    };
  }

  private getFallbackFinalReport(skillCategories: string[]): FinalSessionReport {
    return {
      overallScore: 62,
      strengths: [
        'Maintained composure and provided structured responses.',
        'Showed practical backend awareness.',
        'Attempted tradeoff discussion in core areas.',
      ],
      weakAreas: [
        'More explicit failure-mode reasoning is needed.',
        'Scalability bottlenecks should be identified earlier.',
        'Data modeling choices need stronger justification.',
      ],
      communicationFeedback:
        'Your delivery is clear. Improve by opening each answer with assumptions and constraints before proposing design choices.',
      technicalFeedback:
        'Add stronger depth around resiliency patterns, consistency tradeoffs, and operational observability to raise interview performance.',
      improvementPlan:
        'Do 3 timed mock questions per week and always include architecture, tradeoffs, failure handling, and scaling path in your structure.',
      skillBreakdown: skillCategories.map((skill) => ({ skill, score: 6 })),
      learningResources: [
        { title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' },
        { title: 'Node.js Learn', url: 'https://nodejs.org/en/learn' },
      ],
    };
  }

  private getTopicSkillCategories(topic: string): string[] {
    const key = topic.trim().toLowerCase();
    const table: Record<string, string[]> = {
      javascript: ['closures', 'prototype', 'async programming', 'memory'],
      'node.js': ['event loop', 'streams', 'performance', 'scaling'],
      'system design': ['architecture', 'scalability', 'data modeling', 'caching'],
      java: ['jvm', 'concurrency', 'memory management', 'collections'],
      c: ['pointers', 'memory', 'segmentation faults', 'concurrency'],
    };

    return table[key] ?? ['architecture', 'scalability', 'data modeling', 'caching'];
  }

  private mapLearningResources(topic: string, missingConcepts: string[]): Array<{ title: string; url: string }> {
    const normalizedTopic = topic.toLowerCase();
    const resources: Array<{ title: string; url: string }> = [];

    if (normalizedTopic.includes('node') || normalizedTopic.includes('javascript')) {
      resources.push({ title: 'Node.js Learn', url: 'https://nodejs.org/en/learn' });
    }
    if (missingConcepts.some((item) => /cache|redis/i.test(item))) {
      resources.push({ title: 'Redis Caching Patterns', url: 'https://redis.io/learn/howtos/solutions/caching' });
    }
    if (missingConcepts.some((item) => /tradeoff|architecture|scal/i.test(item))) {
      resources.push({ title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' });
    }

    if (resources.length === 0) {
      resources.push({ title: 'Designing Data-Intensive Applications Notes', url: 'https://dataintensive.net/' });
    }

    return resources.slice(0, 3);
  }

  private toString(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }

  private toStringList(value: unknown, fallback: string[]): string[] {
    if (!Array.isArray(value)) {
      return fallback;
    }

    const list = value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean)
      .slice(0, 3);

    return list.length > 0 ? list : fallback;
  }

  private safeNumber(value: unknown, fallback: number): number {
    const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : fallback;
    const safe = Number.isFinite(numeric) ? numeric : fallback;
    return Math.max(0, Math.min(10, Math.round(safe)));
  }
}

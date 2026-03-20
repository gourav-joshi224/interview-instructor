import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { StorageService, StoredQuestionPlanItem } from '../storage/storage.service';
import { QuestionAssemblyService } from '../interview-brain';
import { TOPIC_DISPLAY_MAP, toTopicId } from '../interview-brain/domain/topic-routing.util';
import { SessionEvaluationService } from './session-evaluation.service';
import { FinishSessionDto } from './dto/finish-session.dto';
import { ProgressSessionDto } from './dto/progress-session.dto';
import { StartSessionDto } from './dto/start-session.dto';

@Injectable()
export class SessionService {
  constructor(
    private readonly storageService: StorageService,
    private readonly sessionEvaluationService: SessionEvaluationService,
    private readonly questionAssembly: QuestionAssemblyService,
  ) {}

  async start(input: StartSessionDto): Promise<{ sessionId: string; question: string; questionId: string }> {
    const { questionPlan, deficit } = await this.buildPlan(input, input.userId);
    const firstQuestion = questionPlan[0];

    if (!firstQuestion) {
      throw new HttpException({ error: 'SESSION_PLAN_MISSING' }, 500);
    }

    const sessionId = await this.storageService.createInterviewSession({
      topic: input.topic,
      experience: input.experience,
      difficulty: input.difficulty,
      totalQuestions: input.totalQuestions,
      questionDeficit: deficit,
      answers: [],
      questionPlan,
      status: 'in_progress',
      report: null,
      // TODO: make required once ApiKeyGuard is replaced with JWT guard
      userId: input.userId ?? null,
    });

    return {
      sessionId,
      question: firstQuestion.renderedQuestion,
      questionId: firstQuestion.questionId,
    };
  }

  async progress(input: ProgressSessionDto): Promise<{ ok: boolean; question?: string; questionId?: string }> {
    const existing = await this.storageService.getInterviewSession(input.sessionId);

    if (!existing) {
      throw new NotFoundException('Interview session not found.');
    }

    const questionPlan = this.extractStoredPlan(input.sessionId, existing);
    const alignedAnswers = this.bindAnswersToPlan(input.sessionId, questionPlan, input.answers, {
      validateQuestionText: false,
    });

    await this.storageService.updateInterviewSession(input.sessionId, {
      answers: alignedAnswers,
      status: 'in_progress',
    });

    const nextQuestion = questionPlan[input.answers.length];

    return {
      ok: true,
      question: nextQuestion?.renderedQuestion,
      questionId: nextQuestion?.questionId,
    };
  }

  async finish(input: FinishSessionDto): Promise<Record<string, unknown>> {
    const session = await this.storageService.getInterviewSession(input.sessionId);

    if (!session) {
      throw new NotFoundException('Interview session not found.');
    }

    const topic = String(session.topic ?? 'System Design');
    const experience = String(session.experience ?? 'mid-level');
    const difficulty = String(session.difficulty ?? 'medium');
    const totalQuestions = Number(session.totalQuestions ?? 5);
    const questionPlan = this.extractStoredPlan(input.sessionId, session);
    const alignedAnswers = this.bindAnswersToPlan(input.sessionId, questionPlan, input.answers, {
      validateQuestionText: true,
    });

    const evaluation = this.sessionEvaluationService.evaluate({
      sessionId: input.sessionId,
      topic,
      experience,
      difficulty,
      totalQuestions,
      answers: alignedAnswers,
      questionPlan,
    });

    await this.storageService.updateInterviewSession(input.sessionId, {
      topic,
      experience,
      difficulty,
      totalQuestions,
      answers: alignedAnswers,
      questionPlan,
      status: 'completed',
      report: evaluation.report,
    }, { markFinished: true });

    return {
      sessionId: input.sessionId,
      topic,
      experience,
      difficulty,
      totalQuestions,
      answers: input.answers,
      status: 'completed',
      report: evaluation.report,
      questionResults: evaluation.questionResults,
      debugTrace: evaluation.debugTrace,
    };
  }

  private async buildPlan(input: StartSessionDto, userId?: string) {
    void userId;
    const topicId = toTopicId(input.topic);
    if (!topicId) {
      throw new HttpException({
        error: 'UNSUPPORTED_TOPIC',
        topic: input.topic,
        supported: Object.keys(TOPIC_DISPLAY_MAP),
      }, 400);
    }
    try {
      const { questions, deficit } = this.questionAssembly.assemble({
        topicId,
        difficulty: input.difficulty,
        experience: input.experience,
        totalQuestions: input.totalQuestions,
        selectionOptions: {
          // TODO: replace with server-side history once userId auth is active
          excludeQuestionTexts: input.recentQuestionIds ?? [],
        },
      });

      const questionPlan = questions.map((instance) => ({
        questionId: instance.questionId,
        topicId: instance.topicId,
        familyKey: instance.familyKey,
        archetype: instance.archetype,
        hookId: instance.hookId,
        concepts: instance.concepts,
        subtopic: instance.subtopic,
        rubricId: instance.rubricId,
        constraintSnapshot: instance.constraintSnapshot,
        renderedQuestion: instance.rendered.text,
      })) as StoredQuestionPlanItem[];

      return { questionPlan, deficit };
    } catch (error) {
      throw new HttpException(
        { error: 'PLAN_GENERATION_FAILED', message: (error as Error)?.message ?? 'Plan assembly failed' },
        500,
      );
    }
  }

  private extractStoredPlan(sessionId: string, session: Record<string, unknown> | null): StoredQuestionPlanItem[] {
    const plan = Array.isArray((session as { questionPlan?: unknown[] } | null)?.questionPlan)
      ? ((session as { questionPlan?: StoredQuestionPlanItem[] } | null)?.questionPlan ?? [])
      : [];

    if (!plan.length) {
      throw new HttpException({ error: 'SESSION_PLAN_MISSING', sessionId }, 500);
    }

    return plan;
  }

  private bindAnswersToPlan(
    sessionId: string,
    questionPlan: StoredQuestionPlanItem[],
    answers: Array<{ questionId: string; question: string; answer: string }>,
    options: { validateQuestionText: boolean },
  ): Array<{ questionId: string; question: string; answer: string }> {
    const planById = new Map(questionPlan.map((item) => [item.questionId, item]));
    const submittedById = new Map<string, { questionId: string; question: string; answer: string }>();

    for (const answer of answers) {
      const planItem = planById.get(answer.questionId);
      if (!planItem) {
        throw new HttpException(
          { error: 'ANSWER_BINDING_FAILED', questionId: answer.questionId, message: 'Question not found in session plan' },
          400,
        );
      }

      if (options.validateQuestionText) {
        const submittedText = (answer.question ?? '').trim().toLowerCase();
        const storedText = (planItem.renderedQuestion ?? '').trim().toLowerCase();

        if (submittedText !== storedText) {
          throw new HttpException({ error: 'QUESTION_TEXT_MISMATCH', questionId: answer.questionId }, 400);
        }
      }

      submittedById.set(answer.questionId, answer);
    }

    if (questionPlan.length === 0) {
      throw new HttpException({ error: 'SESSION_PLAN_MISSING', sessionId }, 500);
    }

    return questionPlan.map((planItem) => {
      const matched = submittedById.get(planItem.questionId);

      return {
        questionId: planItem.questionId,
        question: planItem.renderedQuestion,
        answer: matched?.answer ?? '',
      };
    });
  }
}

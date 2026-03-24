import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { CacheService } from '../cache/cache.service';
import { QuestionAssemblyService } from '../interview-brain';
import { toTopicId } from '../interview-brain/domain/topic-routing.util';
import { StorageService } from '../storage/storage.service';
import { EvaluateAnswerDto } from './dto/evaluate-answer.dto';
import { QuestionDto } from './dto/question.dto';

@Injectable()
export class InterviewService {
  private readonly logger = new Logger(InterviewService.name);

  constructor(
    private readonly aiService: AiService,
    private readonly cacheService: CacheService,
    private readonly storageService: StorageService,
    private readonly questionAssembly: QuestionAssemblyService,
  ) {}

  async question(input: QuestionDto): Promise<{ question: string; questionId?: string }> {
    // Placeholder cache hook for future optimization.
    await this.cacheService.get<{ question: string }>(`question:${input.topic.toLowerCase()}`);

    const assembled = this.assembleFromTopicPack(input);
    if (assembled) {
      return assembled;
    }

    return this.aiService.generateQuestion({
      topic: input.topic,
      experience: input.experience,
      difficulty: input.difficulty,
    });
  }

  async evaluate(input: EvaluateAnswerDto): Promise<{
    score: number;
    strengths: string[];
    missingConcepts: string[];
    explanationForUser: string;
    idealAnswer: string;
    followUpQuestion: string;
    skillBreakdown: object;
    learningResources: object[];
  }> {
    this.logger.log('Evaluating interview answer');

    const result = await this.aiService.evaluateAnswer({
      topic: input.topic,
      question: input.question,
      answer: input.answer,
    });

    await this.storageService.saveInterview({
      topic: input.topic ?? 'Backend Development',
      experience: input.experience ?? 'unknown',
      difficulty: input.difficulty ?? 'unknown',
      mode: input.mode,
      selectedSkill: input.selectedSkill,
      question: input.question,
      answer: input.answer,
      ...result,
      cached: false,
    });

    return {
      score: result.score,
      strengths: result.strengths,
      missingConcepts: result.missingConcepts,
      explanationForUser: result.explanationForUser,
      idealAnswer: result.idealAnswer,
      followUpQuestion: result.followUpQuestion,
      skillBreakdown: result.skillBreakdown,
      learningResources: result.learningResources,
    };
  }

  private assembleFromTopicPack(input: QuestionDto): { question: string; questionId?: string } | null {
    const topicId = toTopicId(input.topic);
    if (!topicId) return null;
    try {
      const assembled = this.questionAssembly.assemble({
        topicId,
        difficulty: input.difficulty ?? 'medium',
        experience: input.experience ?? 'mid',
        totalQuestions: 1,
      });
      if (assembled.questions.length > 0) {
        return {
          question: assembled.questions[0].rendered.text,
          questionId: assembled.questions[0].questionId,
        };
      }
    } catch (error) {
      this.logger.warn(`Assembly pipeline failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    return null;
  }
}

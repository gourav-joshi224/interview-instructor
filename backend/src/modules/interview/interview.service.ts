import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { CacheService } from '../cache/cache.service';
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
  ) {}

  async question(input: QuestionDto): Promise<{ question: string }> {
    // Placeholder cache hook for future optimization.
    await this.cacheService.get<{ question: string }>(`question:${input.topic.toLowerCase()}`);

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
}

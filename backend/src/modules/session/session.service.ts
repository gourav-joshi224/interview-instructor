import { Injectable, NotFoundException } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { StorageService } from '../storage/storage.service';
import { FinishSessionDto } from './dto/finish-session.dto';
import { ProgressSessionDto } from './dto/progress-session.dto';
import { StartSessionDto } from './dto/start-session.dto';

@Injectable()
export class SessionService {
  constructor(
    private readonly storageService: StorageService,
    private readonly aiService: AiService,
  ) {}

  async start(input: StartSessionDto): Promise<{ sessionId: string }> {
    const sessionId = await this.storageService.createInterviewSession({
      topic: input.topic,
      experience: input.experience,
      difficulty: input.difficulty,
      totalQuestions: input.totalQuestions,
      answers: [],
      status: 'in_progress',
      report: null,
    });

    return { sessionId };
  }

  async progress(input: ProgressSessionDto): Promise<{ ok: boolean }> {
    await this.storageService.updateInterviewSession(input.sessionId, {
      topic: input.topic,
      experience: input.experience,
      difficulty: input.difficulty,
      totalQuestions: input.totalQuestions,
      answers: input.answers,
      status: 'in_progress',
      report: null,
    });

    return { ok: true };
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

    const report = await this.aiService.generateFinalSessionReport({
      topic,
      experience,
      difficulty,
      answers: input.answers,
    });

    await this.storageService.updateInterviewSession(input.sessionId, {
      topic,
      experience,
      difficulty,
      totalQuestions,
      answers: input.answers,
      status: 'completed',
      report,
    });

    return {
      sessionId: input.sessionId,
      topic,
      experience,
      difficulty,
      totalQuestions,
      answers: input.answers,
      status: 'completed',
      report,
    };
  }
}

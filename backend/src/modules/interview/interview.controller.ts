import { Body, Controller, Post } from '@nestjs/common';
import { EvaluateAnswerDto } from './dto/evaluate-answer.dto';
import { QuestionDto } from './dto/question.dto';
import { InterviewService } from './interview.service';

@Controller(['interview', 'api/interview'])
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  @Post('question')
  async question(@Body() payload: QuestionDto): Promise<{ question: string }> {
    return this.interviewService.question(payload);
  }

  @Post('evaluate')
  async evaluate(@Body() payload: EvaluateAnswerDto): Promise<{
    score: number;
    strengths: string[];
    missingConcepts: string[];
    explanationForUser: string;
    idealAnswer: string;
    followUpQuestion: string;
    skillBreakdown: object;
    learningResources: object[];
  }> {
    return this.interviewService.evaluate(payload);
  }
}

import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { EvaluateAnswerDto } from './dto/evaluate-answer.dto';
import { QuestionDto } from './dto/question.dto';
import { InterviewService } from './interview.service';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';

@ApiTags('Interview')
@Controller(['interview', 'api/interview'])
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  @ApiOperation({ summary: 'Generate an interview question' })
  @Post('question')
  @UseGuards(ApiKeyGuard)
  async question(@Body() payload: QuestionDto): Promise<{ question: string; questionId?: string }> {
    return this.interviewService.question(payload);
  }

  @ApiOperation({ summary: 'Evaluate an interview answer' })
  @Post('evaluate')
  @UseGuards(ApiKeyGuard)
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

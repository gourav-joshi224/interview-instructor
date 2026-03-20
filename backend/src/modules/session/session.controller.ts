import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FinishSessionDto } from './dto/finish-session.dto';
import { ProgressSessionDto } from './dto/progress-session.dto';
import { StartSessionDto } from './dto/start-session.dto';
import { SessionService } from './session.service';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';

@ApiTags('Session')
@Controller(['session', 'api/session'])
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @ApiOperation({ summary: 'Start a new interview session' })
  @Post('start')
  @UseGuards(ApiKeyGuard)
  async start(@Body() payload: StartSessionDto): Promise<{ sessionId: string; question: string; questionId: string }> {
    return this.sessionService.start(payload);
  }

  @ApiOperation({ summary: 'Save session progress' })
  @Post('progress')
  @UseGuards(ApiKeyGuard)
  async progress(@Body() payload: ProgressSessionDto): Promise<{ ok: boolean; question?: string; questionId?: string }> {
    return this.sessionService.progress(payload);
  }

  @ApiOperation({ summary: 'Finish session and generate report' })
  @Post('finish')
  @UseGuards(ApiKeyGuard)
  async finish(@Body() payload: FinishSessionDto): Promise<Record<string, unknown>> {
    return this.sessionService.finish(payload);
  }
}

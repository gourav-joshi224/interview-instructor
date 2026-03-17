import { Body, Controller, Post } from '@nestjs/common';
import { FinishSessionDto } from './dto/finish-session.dto';
import { ProgressSessionDto } from './dto/progress-session.dto';
import { StartSessionDto } from './dto/start-session.dto';
import { SessionService } from './session.service';

@Controller(['session', 'api/session'])
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post('start')
  async start(@Body() payload: StartSessionDto): Promise<{ sessionId: string }> {
    return this.sessionService.start(payload);
  }

  @Post('progress')
  async progress(@Body() payload: ProgressSessionDto): Promise<{ ok: boolean }> {
    return this.sessionService.progress(payload);
  }

  @Post('finish')
  async finish(@Body() payload: FinishSessionDto): Promise<Record<string, unknown>> {
    return this.sessionService.finish(payload);
  }
}

import { Module } from '@nestjs/common';
import { InterviewBrainModule } from '../interview-brain';
import { AiService } from './ai.service';

@Module({
  imports: [InterviewBrainModule],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}

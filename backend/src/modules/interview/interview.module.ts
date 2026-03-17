import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { CacheModule } from '../cache/cache.module';
import { InterviewController } from './interview.controller';
import { InterviewService } from './interview.service';

@Module({
  imports: [AiModule, CacheModule],
  controllers: [InterviewController],
  providers: [InterviewService],
})
export class InterviewModule {}

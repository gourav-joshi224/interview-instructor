import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { CacheModule } from '../cache/cache.module';
import { InterviewBrainModule } from '../interview-brain';
import { InterviewController } from './interview.controller';
import { InterviewService } from './interview.service';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';

@Module({
  imports: [AiModule, CacheModule, InterviewBrainModule],
  controllers: [InterviewController],
  providers: [InterviewService, ApiKeyGuard],
})
export class InterviewModule {}

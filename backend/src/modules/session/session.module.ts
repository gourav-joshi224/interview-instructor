import { Module } from '@nestjs/common';
import { InterviewBrainModule } from '../interview-brain/interview-brain.module';
import { StorageModule } from '../storage/storage.module';
import { SessionController } from './session.controller';
import { SessionEvaluationService } from './session-evaluation.service';
import { SessionService } from './session.service';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';

@Module({
  imports: [StorageModule, InterviewBrainModule],
  controllers: [SessionController],
  providers: [SessionService, SessionEvaluationService, ApiKeyGuard],
})
export class SessionModule {}

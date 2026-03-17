import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { StorageModule } from '../storage/storage.module';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';

@Module({
  imports: [StorageModule, AiModule],
  controllers: [SessionController],
  providers: [SessionService],
})
export class SessionModule {}

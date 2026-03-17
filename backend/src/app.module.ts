import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import envConfig from './config/env.config';
import { AiModule } from './modules/ai/ai.module';
import { CacheModule } from './modules/cache/cache.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { InterviewModule } from './modules/interview/interview.module';
import { SessionModule } from './modules/session/session.module';
import { StorageModule } from './modules/storage/storage.module';
import { ThrottlerPlaceholderModule } from './modules/throttler-placeholder/throttler-placeholder.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
    }),
    StorageModule,
    CacheModule,
    AiModule,
    InterviewModule,
    SessionModule,
    DashboardModule,
    ThrottlerPlaceholderModule,
  ],
})
export class AppModule {}

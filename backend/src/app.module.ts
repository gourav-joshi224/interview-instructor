import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import envConfig from './config/env.config';
import { AiModule } from './modules/ai/ai.module';
import { CacheModule } from './modules/cache/cache.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { InterviewModule } from './modules/interview/interview.module';
import { SessionModule } from './modules/session/session.module';
import { StorageModule } from './modules/storage/storage.module';
import { RateLimitGuard } from './common/guards/rate-limit.guard';

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
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule {}

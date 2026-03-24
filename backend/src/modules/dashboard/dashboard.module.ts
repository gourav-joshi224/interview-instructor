import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { DashboardController } from './dashboard.controller';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';

@Module({
  imports: [StorageModule],
  controllers: [DashboardController],
  providers: [ApiKeyGuard],
})
export class DashboardModule {}

import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [StorageModule],
  controllers: [DashboardController],
})
export class DashboardModule {}

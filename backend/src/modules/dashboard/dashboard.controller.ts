import { Controller, Get, Query } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';

@Controller(['dashboard', 'api/dashboard'])
export class DashboardController {
  constructor(private readonly storageService: StorageService) {}

  @Get('interviews')
  async interviews(@Query('limit') limit?: string): Promise<Array<Record<string, unknown>>> {
    const parsedLimit = Number(limit ?? '20');
    const safeLimit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 20;
    return this.storageService.getRecentInterviews(safeLimit);
  }
}

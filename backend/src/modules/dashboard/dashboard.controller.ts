import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StorageService } from '../storage/storage.service';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';

@ApiTags('Dashboard')
@Controller(['dashboard', 'api/dashboard'])
export class DashboardController {
  constructor(private readonly storageService: StorageService) {}

  @ApiOperation({ summary: 'List recent interviews' })
  @Get('interviews')
  @UseGuards(ApiKeyGuard)
  async interviews(@Query('limit') limit?: string): Promise<Array<Record<string, unknown>>> {
    const safeLimit = Math.min(Math.max(parseInt(limit ?? '10', 10), 1), 50);
    return this.storageService.getRecentInterviews(safeLimit);
  }
}

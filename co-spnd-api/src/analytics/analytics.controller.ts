import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service';
import { WorkspaceMemberGuard } from '../workspaces/workspace-member.guard';

@Controller('workspaces/:workspaceId/analytics')
@UseGuards(AuthGuard('jwt'), WorkspaceMemberGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get()
  async getAnalytics(
    @Param('workspaceId') workspaceId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getAnalytics(workspaceId, from, to);
  }

  @Get('trends')
  async getTrends(
    @Param('workspaceId') workspaceId: string,
    @Query('granularity') granularity: 'day' | 'month' = 'day',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getTrends(workspaceId, granularity, from, to);
  }

  @Get('top-expenses')
  async getTopExpenses(
    @Param('workspaceId') workspaceId: string,
    @Query('limit') limit: string = '10',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getTopExpenses(workspaceId, parseInt(limit, 10), from, to);
  }

  @Get('comparison')
  async getComparison(@Param('workspaceId') workspaceId: string) {
    return this.analyticsService.getComparison(workspaceId);
  }

  @Get('category-trends')
  async getCategoryTrends(
    @Param('workspaceId') workspaceId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getCategoryTrends(workspaceId, from, to);
  }
}

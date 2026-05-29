import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service';
import { WorkspaceMemberGuard } from '../workspaces/workspace-member.guard';

interface AuthenticatedRequest {
  user: {
    userId: string;
  };
}

@Controller()
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('analytics/me')
  @UseGuards(AuthGuard('jwt'))
  async getUserAnalytics(
    @Request() req: AuthenticatedRequest,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getUserAnalytics(req.user.userId, from, to);
  }

  @Get('workspaces/:workspaceId/analytics')
  @UseGuards(AuthGuard('jwt'), WorkspaceMemberGuard)
  async getAnalytics(
    @Param('workspaceId') workspaceId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getAnalytics(workspaceId, from, to);
  }

  @Get('workspaces/:workspaceId/analytics/trends')
  @UseGuards(AuthGuard('jwt'), WorkspaceMemberGuard)
  async getTrends(
    @Param('workspaceId') workspaceId: string,
    @Query('granularity') granularity: 'day' | 'month' = 'day',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getTrends(workspaceId, granularity, from, to);
  }

  @Get('workspaces/:workspaceId/analytics/top-expenses')
  @UseGuards(AuthGuard('jwt'), WorkspaceMemberGuard)
  async getTopExpenses(
    @Param('workspaceId') workspaceId: string,
    @Query('limit') limit: string = '10',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getTopExpenses(
      workspaceId,
      parseInt(limit, 10),
      from,
      to,
    );
  }

  @Get('workspaces/:workspaceId/analytics/comparison')
  @UseGuards(AuthGuard('jwt'), WorkspaceMemberGuard)
  async getComparison(@Param('workspaceId') workspaceId: string) {
    return this.analyticsService.getComparison(workspaceId);
  }

  @Get('workspaces/:workspaceId/analytics/category-trends')
  @UseGuards(AuthGuard('jwt'), WorkspaceMemberGuard)
  async getCategoryTrends(
    @Param('workspaceId') workspaceId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getCategoryTrends(workspaceId, from, to);
  }
}

/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Transaction,
  TransactionDocument,
} from '../transactions/transaction.schema';
import { WorkspacesService } from '../workspaces/workspaces.service';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    private workspacesService: WorkspacesService,
  ) {}

  private buildDateMatch(
    from?: string,
    to?: string,
  ): Record<string, Date> | undefined {
    if (!from && !to) return undefined;

    const date: Record<string, Date> = {};
    if (from) date.$gte = new Date(from);
    if (to) date.$lte = new Date(to);
    return date;
  }

  async getAnalytics(workspaceId: string, from?: string, to?: string) {
    const matchStage: any = { workspaceId: new Types.ObjectId(workspaceId) };

    const dateMatch = this.buildDateMatch(from, to);
    if (dateMatch) matchStage.date = dateMatch;

    const totalResult = await this.transactionModel.aggregate([
      { $match: matchStage },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const byCategory = await this.transactionModel.aggregate([
      { $match: matchStage },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $project: { category: '$_id', total: 1, _id: 0 } },
    ]);

    const byUser = await this.transactionModel.aggregate([
      { $match: matchStage },
      { $group: { _id: '$spenderId', total: { $sum: '$amount' } } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          userId: '$_id',
          name: '$user.name',
          total: 1,
          _id: 0,
        },
      },
    ]);

    return {
      total: totalResult[0]?.total || 0,
      byCategory,
      byUser,
    };
  }

  async getUserAnalytics(userId: string, from?: string, to?: string) {
    const workspaces = await this.workspacesService.findByUser(userId);
    const workspaceIds = workspaces.map((workspace) => workspace._id);

    if (workspaceIds.length === 0) {
      return {
        totalsByCurrency: [],
        byCategory: [],
        byWorkspace: [],
      };
    }

    const userObjectId = new Types.ObjectId(userId);
    const dateMatch = this.buildDateMatch(from, to);
    const baseMatch: Record<string, unknown> = {
      workspaceId: { $in: workspaceIds },
    };
    if (dateMatch) baseMatch.date = dateMatch;
    const userMatch = { ...baseMatch, spenderId: userObjectId };

    const [
      totalsByCurrency,
      byCategory,
      userWorkspaceTotals,
      workspaceTotals,
      workspaceCategories,
    ] = await Promise.all([
      this.transactionModel.aggregate([
        { $match: userMatch },
        {
          $lookup: {
            from: 'workspaces',
            localField: 'workspaceId',
            foreignField: '_id',
            as: 'workspace',
          },
        },
        { $unwind: '$workspace' },
        {
          $group: {
            _id: '$workspace.currency',
            total: { $sum: '$amount' },
            transactionCount: { $sum: 1 },
          },
        },
        {
          $project: {
            currency: '$_id',
            total: { $round: ['$total', 2] },
            transactionCount: 1,
            _id: 0,
          },
        },
        { $sort: { total: -1 } },
      ]),
      this.transactionModel.aggregate([
        { $match: userMatch },
        {
          $lookup: {
            from: 'workspaces',
            localField: 'workspaceId',
            foreignField: '_id',
            as: 'workspace',
          },
        },
        { $unwind: '$workspace' },
        {
          $group: {
            _id: { category: '$category', currency: '$workspace.currency' },
            total: { $sum: '$amount' },
          },
        },
        {
          $project: {
            category: '$_id.category',
            currency: '$_id.currency',
            total: { $round: ['$total', 2] },
            _id: 0,
          },
        },
        { $sort: { total: -1 } },
      ]),
      this.transactionModel.aggregate([
        { $match: userMatch },
        {
          $group: {
            _id: '$workspaceId',
            total: { $sum: '$amount' },
            transactionCount: { $sum: 1 },
          },
        },
      ]),
      this.transactionModel.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: '$workspaceId',
            total: { $sum: '$amount' },
            transactionCount: { $sum: 1 },
          },
        },
      ]),
      this.transactionModel.aggregate([
        { $match: userMatch },
        {
          $group: {
            _id: { workspaceId: '$workspaceId', category: '$category' },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { total: -1 } },
      ]),
    ]);

    const userTotals = new Map<
      string,
      { total: number; transactionCount: number }
    >();
    for (const item of userWorkspaceTotals) {
      userTotals.set(item._id.toString(), {
        total: Math.round((item.total ?? 0) * 100) / 100,
        transactionCount: item.transactionCount ?? 0,
      });
    }

    const workspaceTotalMap = new Map<
      string,
      { total: number; transactionCount: number }
    >();
    for (const item of workspaceTotals) {
      workspaceTotalMap.set(item._id.toString(), {
        total: Math.round((item.total ?? 0) * 100) / 100,
        transactionCount: item.transactionCount ?? 0,
      });
    }

    const categoryMap = new Map<
      string,
      { category: string; total: number }[]
    >();
    for (const item of workspaceCategories) {
      const workspaceId = item._id.workspaceId.toString();
      const entries = categoryMap.get(workspaceId) ?? [];
      entries.push({
        category: item._id.category,
        total: Math.round((item.total ?? 0) * 100) / 100,
      });
      categoryMap.set(workspaceId, entries);
    }

    return {
      totalsByCurrency,
      byCategory,
      byWorkspace: workspaces
        .map((workspace) => {
          const workspaceId = workspace._id.toString();
          const userTotal = userTotals.get(workspaceId) ?? {
            total: 0,
            transactionCount: 0,
          };
          const workspaceTotal = workspaceTotalMap.get(workspaceId) ?? {
            total: 0,
            transactionCount: 0,
          };

          return {
            workspaceId,
            name: workspace.name,
            currency: workspace.currency,
            userTotal: userTotal.total,
            workspaceTotal: workspaceTotal.total,
            userTransactionCount: userTotal.transactionCount,
            workspaceTransactionCount: workspaceTotal.transactionCount,
            byCategory: categoryMap.get(workspaceId) ?? [],
          };
        })
        .sort((a, b) => b.userTotal - a.userTotal),
    };
  }

  async getTrends(
    workspaceId: string,
    granularity: 'day' | 'month' = 'day',
    from?: string,
    to?: string,
  ) {
    const matchStage: any = { workspaceId: new Types.ObjectId(workspaceId) };
    if (from || to) {
      matchStage.date = {};
      if (from) matchStage.date.$gte = new Date(from);
      if (to) matchStage.date.$lte = new Date(to);
    }

    const dateFormat = granularity === 'month' ? '%Y-%m' : '%Y-%m-%d';

    const data = await this.transactionModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$date' } },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', total: 1, _id: 0 } },
    ]);

    return { granularity, data };
  }

  async getTopExpenses(
    workspaceId: string,
    limit: number = 10,
    from?: string,
    to?: string,
  ) {
    const matchStage: any = { workspaceId: new Types.ObjectId(workspaceId) };
    if (from || to) {
      matchStage.date = {};
      if (from) matchStage.date.$gte = new Date(from);
      if (to) matchStage.date.$lte = new Date(to);
    }

    const expenses = await this.transactionModel.aggregate([
      { $match: matchStage },
      { $sort: { amount: -1 } },
      { $limit: Math.max(1, Math.min(isNaN(limit) ? 10 : limit, 50)) },
      {
        $lookup: {
          from: 'users',
          localField: 'spenderId',
          foreignField: '_id',
          as: 'spender',
        },
      },
      { $unwind: '$spender' },
      {
        $project: {
          id: '$_id',
          amount: 1,
          category: 1,
          description: 1,
          date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          spenderName: '$spender.name',
          _id: 0,
        },
      },
    ]);

    return { expenses };
  }

  async getComparison(workspaceId: string) {
    const now = new Date();
    const currentFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentTo = now;
    const previousFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousTo = new Date(now.getFullYear(), now.getMonth(), 0);

    const workspaceObjectId = new Types.ObjectId(workspaceId);

    const [currentResult, previousResult] = await Promise.all([
      this.transactionModel.aggregate([
        {
          $match: {
            workspaceId: workspaceObjectId,
            date: { $gte: currentFrom, $lte: currentTo },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.transactionModel.aggregate([
        {
          $match: {
            workspaceId: workspaceObjectId,
            date: { $gte: previousFrom, $lte: previousTo },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const currentTotal = Math.round((currentResult[0]?.total ?? 0) * 100) / 100;
    const previousTotal =
      Math.round((previousResult[0]?.total ?? 0) * 100) / 100;
    const delta = Math.round((currentTotal - previousTotal) * 100) / 100;
    const deltaPercent =
      previousTotal === 0
        ? null
        : Math.round(((currentTotal - previousTotal) / previousTotal) * 10000) /
          100;

    return {
      current: {
        total: currentTotal,
        from: currentFrom.toISOString().split('T')[0],
        to: currentTo.toISOString().split('T')[0],
      },
      previous: {
        total: previousTotal,
        from: previousFrom.toISOString().split('T')[0],
        to: previousTo.toISOString().split('T')[0],
      },
      delta,
      deltaPercent,
    };
  }

  async getPaymentMethodAnalytics(workspaceId: string, from?: string, to?: string) {
    const matchStage: any = { workspaceId: new Types.ObjectId(workspaceId) };
    const dateMatch = this.buildDateMatch(from, to);
    if (dateMatch) matchStage.date = dateMatch;

    const byPaymentMethod = await this.transactionModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          paymentMethod: '$_id',
          total: { $round: ['$total', 2] },
          count: 1,
          _id: 0,
        },
      },
      { $sort: { total: -1 } },
    ]);

    return { byPaymentMethod };
  }

  async getCategoryTrends(workspaceId: string, from?: string, to?: string) {
    const matchStage: any = { workspaceId: new Types.ObjectId(workspaceId) };
    if (from || to) {
      matchStage.date = {};
      if (from) matchStage.date.$gte = new Date(from);
      if (to) matchStage.date.$lte = new Date(to);
    }

    const raw = await this.transactionModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            category: '$category',
            month: { $dateToString: { format: '%Y-%m', date: '$date' } },
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    if (raw.length === 0) return { months: [], series: [] };

    const monthSet = new Set<string>();
    const categoryTotals: Record<string, number> = {};
    const categoryMonthData: Record<string, Record<string, number>> = {};

    for (const item of raw) {
      const { category, month } = item._id;
      monthSet.add(month);
      categoryTotals[category] = (categoryTotals[category] ?? 0) + item.total;
      if (!categoryMonthData[category]) categoryMonthData[category] = {};
      categoryMonthData[category][month] = item.total;
    }

    const months = Array.from(monthSet).sort();

    const top3 = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    const series = top3.map((category) => ({
      category,
      data: months.map(
        (m) => Math.round((categoryMonthData[category]?.[m] ?? 0) * 100) / 100,
      ),
    }));

    return { months, series };
  }
}

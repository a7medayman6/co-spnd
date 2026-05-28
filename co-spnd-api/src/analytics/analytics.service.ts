import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument } from '../transactions/transaction.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
  ) {}

  async getAnalytics(workspaceId: string, from?: string, to?: string) {
    const matchStage: any = { workspaceId: new Types.ObjectId(workspaceId) };

    if (from || to) {
      matchStage.date = {};
      if (from) matchStage.date.$gte = new Date(from);
      if (to) matchStage.date.$lte = new Date(to);
    }

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
    const previousTotal = Math.round((previousResult[0]?.total ?? 0) * 100) / 100;
    const delta = Math.round((currentTotal - previousTotal) * 100) / 100;
    const deltaPercent =
      previousTotal === 0
        ? null
        : Math.round(((currentTotal - previousTotal) / previousTotal) * 10000) / 100;

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
      data: months.map((m) => Math.round((categoryMonthData[category]?.[m] ?? 0) * 100) / 100),
    }));

    return { months, series };
  }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/user.schema';
import { Workspace, WorkspaceDocument } from '../workspaces/workspace.schema';
import { Transaction, TransactionDocument } from '../transactions/transaction.schema';

@Injectable()
export class StatsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Workspace.name) private workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
  ) {}

  async getStats() {
    const [users, workspaces, transactions, currencyAgg] = await Promise.all([
      this.userModel.countDocuments(),
      this.workspaceModel.countDocuments(),
      this.transactionModel.countDocuments(),
      this.transactionModel.aggregate([
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
          },
        },
        { $sort: { total: -1 } },
      ]),
    ]);

    const moneyByCurrency = currencyAgg.map((entry) => ({
      currency: entry._id as string,
      total: Math.round(entry.total * 100) / 100,
    }));

    const totalMoney = Math.round(
      moneyByCurrency.reduce((sum, c) => sum + c.total, 0) * 100,
    ) / 100;

    return { users, workspaces, transactions, totalMoney, moneyByCurrency };
  }
}

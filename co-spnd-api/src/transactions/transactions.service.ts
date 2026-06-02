import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument } from './transaction.schema';
import { CreateTransactionDto, UpdateTransactionDto, ImportTransactionItemDto } from './transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
  ) {}

  async create(
    workspaceId: string,
    userId: string,
    createTransactionDto: CreateTransactionDto,
  ): Promise<TransactionDocument> {
    const transaction = new this.transactionModel({
      amount: createTransactionDto.amount,
      category: createTransactionDto.category,
      description: createTransactionDto.description,
      date: createTransactionDto.date ? new Date(createTransactionDto.date) : new Date(),
      spenderId: createTransactionDto.spenderId
        ? new Types.ObjectId(createTransactionDto.spenderId)
        : new Types.ObjectId(userId),
      createdBy: new Types.ObjectId(userId),
      workspaceId: new Types.ObjectId(workspaceId),
      paymentMethod: createTransactionDto.paymentMethod || 'VISA',
    });
    const saved = await transaction.save();
    const populated = await this.transactionModel
      .findById(saved._id)
      .populate('spenderId', '_id name email')
      .populate('createdBy', '_id name email')
      .exec();
    return populated!;
  }

  async findByWorkspace(
    workspaceId: string,
    from?: string,
    to?: string,
  ): Promise<TransactionDocument[]> {
    const query: any = { workspaceId: new Types.ObjectId(workspaceId) };
    
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    return this.transactionModel
      .find(query)
      .populate('spenderId', '_id name email')
      .populate('createdBy', '_id name email')
      .sort({ date: -1, createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<TransactionDocument | null> {
    return this.transactionModel.findById(id).exec();
  }

  async update(
    transactionId: string,
    userId: string,
    updateTransactionDto: UpdateTransactionDto,
  ): Promise<TransactionDocument | null> {
    const transaction = await this.findById(transactionId);
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const updateData: any = {};
    if (updateTransactionDto.amount !== undefined) updateData.amount = updateTransactionDto.amount;
    if (updateTransactionDto.category !== undefined) updateData.category = updateTransactionDto.category;
    if (updateTransactionDto.description !== undefined) updateData.description = updateTransactionDto.description;
    if (updateTransactionDto.date !== undefined) updateData.date = new Date(updateTransactionDto.date);
    if (updateTransactionDto.spenderId !== undefined) updateData.spenderId = new Types.ObjectId(updateTransactionDto.spenderId);
    if (updateTransactionDto.paymentMethod !== undefined) updateData.paymentMethod = updateTransactionDto.paymentMethod;

    return this.transactionModel
      .findByIdAndUpdate(transactionId, updateData, { new: true })
      .populate('spenderId', '_id name email')
      .populate('createdBy', '_id name email')
      .exec();
  }

  async delete(transactionId: string, userId: string): Promise<void> {
    const transaction = await this.findById(transactionId);
    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    await this.transactionModel.findByIdAndDelete(transactionId).exec();
  }

  async bulkImport(
    workspaceId: string,
    userId: string,
    items: ImportTransactionItemDto[],
  ): Promise<{ imported: number; errors: { row: number; message: string }[] }> {
    let imported = 0;
    const errors: { row: number; message: string }[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        const transaction = new this.transactionModel({
          amount: item.amount,
          category: item.category,
          description: item.description,
          date: item.date ? new Date(item.date) : new Date(),
          spenderId: new Types.ObjectId(userId),
          createdBy: new Types.ObjectId(userId),
          workspaceId: new Types.ObjectId(workspaceId),
          paymentMethod: 'VISA',
        });
        await transaction.save();
        imported++;
      } catch (err: any) {
        errors.push({ row: i + 1, message: err?.message ?? 'Unknown error' });
      }
    }

    return { imported, errors };
  }
}

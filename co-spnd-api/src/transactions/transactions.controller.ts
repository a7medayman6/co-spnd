import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, UpdateTransactionDto } from './transaction.dto';
import { WorkspaceMemberGuard } from '../workspaces/workspace-member.guard';

@Controller()
@UseGuards(AuthGuard('jwt'))
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  private serializeTransaction(t: any) {
    const spender = t.spenderId as any;
    const creator = t.createdBy as any;
    return {
      id: t._id,
      amount: t.amount,
      category: t.category,
      description: t.description,
      date: t.date,
      spenderId: spender?._id?.toString() ?? spender?.toString() ?? '',
      spenderName: spender?.name ?? '',
      createdBy: creator?._id?.toString() ?? creator?.toString() ?? '',
      workspaceId: t.workspaceId,
      paymentMethod: t.paymentMethod,
    };
  }

  @Post('workspaces/:workspaceId/transactions')
  @UseGuards(WorkspaceMemberGuard)
  async create(
    @Param('workspaceId') workspaceId: string,
    @Request() req: any,
    @Body() createTransactionDto: CreateTransactionDto,
  ) {
    const transaction = await this.transactionsService.create(
      workspaceId,
      req.user.userId,
      createTransactionDto,
    );
    return this.serializeTransaction(transaction);
  }

  @Get('workspaces/:workspaceId/transactions')
  @UseGuards(WorkspaceMemberGuard)
  async findAll(
    @Param('workspaceId') workspaceId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const transactions = await this.transactionsService.findByWorkspace(workspaceId, from, to);
    return transactions.map((t) => this.serializeTransaction(t));
  }

  @Put('transactions/:transactionId')
  async update(
    @Param('transactionId') transactionId: string,
    @Request() req: any,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    const transaction = await this.transactionsService.update(
      transactionId,
      req.user.userId,
      updateTransactionDto,
    );
    if (!transaction) return null;
    return this.serializeTransaction(transaction);
  }

  @Delete('transactions/:transactionId')
  async delete(@Param('transactionId') transactionId: string, @Request() req: any) {
    await this.transactionsService.delete(transactionId, req.user.userId);
    return { success: true };
  }
}

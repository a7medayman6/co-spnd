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
    return {
      id: transaction._id,
      amount: transaction.amount,
      category: transaction.category,
      description: transaction.description,
      date: transaction.date,
      spenderId: transaction.spenderId,
      createdBy: transaction.createdBy,
      workspaceId: transaction.workspaceId,
      paymentMethod: transaction.paymentMethod,
    };
  }

  @Get('workspaces/:workspaceId/transactions')
  @UseGuards(WorkspaceMemberGuard)
  async findAll(
    @Param('workspaceId') workspaceId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const transactions = await this.transactionsService.findByWorkspace(workspaceId, from, to);
    return transactions.map((t) => ({
      id: t._id,
      amount: t.amount,
      category: t.category,
      description: t.description,
      date: t.date,
      spender: t.spenderId,
      createdBy: t.createdBy,
      workspaceId: t.workspaceId,
      paymentMethod: t.paymentMethod,
    }));
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
    if (!transaction) {
      return null;
    }
    return {
      id: transaction._id,
      amount: transaction.amount,
      category: transaction.category,
      description: transaction.description,
      date: transaction.date,
      spenderId: transaction.spenderId,
      createdBy: transaction.createdBy,
      workspaceId: transaction.workspaceId,
      paymentMethod: transaction.paymentMethod,
    };
  }

  @Delete('transactions/:transactionId')
  async delete(@Param('transactionId') transactionId: string, @Request() req: any) {
    await this.transactionsService.delete(transactionId, req.user.userId);
    return { success: true };
  }
}

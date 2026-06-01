import api from './api'
import type { Transaction, CreateTransactionDto, UpdateTransactionDto } from '../types'

export interface ImportTransactionItem {
  amount: number
  category: string
  description?: string
  date?: string
}

export interface ImportResult {
  imported: number
  errors: { row: number; message: string }[]
}

export const transactionsService = {
  async list(workspaceId: string, from?: string, to?: string): Promise<Transaction[]> {
    const params: Record<string, string> = {}
    if (from) params.from = from
    if (to) params.to = to
    const { data } = await api.get<Transaction[]>(
      `/workspaces/${workspaceId}/transactions`,
      { params }
    )
    return data
  },

  async create(workspaceId: string, dto: CreateTransactionDto): Promise<Transaction> {
    const { data } = await api.post<Transaction>(
      `/workspaces/${workspaceId}/transactions`,
      dto
    )
    return data
  },

  async update(transactionId: string, dto: UpdateTransactionDto): Promise<Transaction> {
    const { data } = await api.put<Transaction>(`/transactions/${transactionId}`, dto)
    return data
  },

  async delete(transactionId: string): Promise<void> {
    await api.delete(`/transactions/${transactionId}`)
  },

  async importTransactions(workspaceId: string, transactions: ImportTransactionItem[]): Promise<ImportResult> {
    const { data } = await api.post<ImportResult>(
      `/workspaces/${workspaceId}/transactions/import`,
      { transactions }
    )
    return data
  },
}

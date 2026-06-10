// src/types/index.ts

export interface User {
  id: string
  email: string
  name: string
  avatarUrl: string | null
}

export interface AuthResponse {
  accessToken: string
  user: User
}

export interface Workspace {
  id: string
  name: string
  currency: string
  createdBy?: string
  membersCount?: number
}

export interface WorkspaceMember {
  id: string
  name: string
  email: string
}

export interface Transaction {
  id: string
  amount: number
  category: string
  description?: string
  date: string
  spenderId: string
  spenderName?: string
  createdBy: string
  workspaceId: string
  paymentMethod?: 'CASH' | 'VISA'
}

export interface CreateTransactionDto {
  amount: number
  category: string
  description?: string
  date?: string
  spenderId?: string
  paymentMethod?: 'CASH' | 'VISA'
}

export interface UpdateTransactionDto {
  amount?: number
  category?: string
  description?: string
  date?: string
  spenderId?: string
  paymentMethod?: 'CASH' | 'VISA'
}

export interface Analytics {
  total: number
  byCategory: Array<{ category: string; total: number }>
  byUser: Array<{ userId: string; name: string; total: number }>
}

export interface TrendDataPoint {
  date: string
  total: number
}

export interface TrendsResponse {
  granularity: 'day' | 'month'
  data: TrendDataPoint[]
}

export interface TopExpense {
  id: string
  amount: number
  category: string
  description?: string
  date: string
  spenderName: string
}

export interface TopExpensesResponse {
  expenses: TopExpense[]
}

export interface ComparisonPeriod {
  total: number
  from: string
  to: string
}

export interface ComparisonResponse {
  current: ComparisonPeriod
  previous: ComparisonPeriod
  delta: number
  deltaPercent: number | null
}

export interface PaymentMethodAnalyticsItem {
  paymentMethod: 'VISA' | 'CASH'
  total: number
  count: number
}

export interface PaymentMethodAnalyticsResponse {
  byPaymentMethod: PaymentMethodAnalyticsItem[]
}

export interface CategoryTrendSeries {
  category: string
  data: number[]
}

export interface CategoryTrendsResponse {
  months: string[]
  series: CategoryTrendSeries[]
}

export interface UserAnalytics {
  totalsByCurrency: Array<{ currency: string; total: number; transactionCount: number }>
  byCategory: Array<{ category: string; currency: string; total: number }>
  byWorkspace: Array<{
    workspaceId: string
    name: string
    currency: string
    userTotal: number
    workspaceTotal: number
    userTransactionCount: number
    workspaceTransactionCount: number
    byCategory: Array<{ category: string; total: number }>
  }>
}

export interface Notification {
  id: string
  type: 'workspace_invite' | 'transaction_added'
  title: string
  body: string
  read: boolean
  workspaceId?: string
  transactionId?: string
  createdAt: string
}

export interface SplitEntry {
  userId: string
  name: string
  percentage: number
}

export interface BalanceEntry {
  userId: string
  name: string
  percentage: number
  expectedShare: number
  actualSpend: number
  balance: number
}

export const CATEGORIES = [
  'Food',
  'Groceries',
  'Takeaway',
  'Transportation',
  'Accommodation',
  'Entertainment',
  'Shopping',
  'Health',
  'Bills',
  'Utilities',
  'Subscriptions',
  'Other',
] as const

export type Category = (typeof CATEGORIES)[number]

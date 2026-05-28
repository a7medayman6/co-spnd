import api from './api'
import type {
  Analytics,
  TrendsResponse,
  TopExpensesResponse,
  ComparisonResponse,
  CategoryTrendsResponse,
} from '../types'

export const analyticsService = {
  async get(workspaceId: string, from?: string, to?: string): Promise<Analytics> {
    const params: Record<string, string> = {}
    if (from) params.from = from
    if (to) params.to = to
    const { data } = await api.get<Analytics>(
      `/workspaces/${workspaceId}/analytics`,
      { params }
    )
    return data
  },

  async getTrends(
    workspaceId: string,
    granularity: 'day' | 'month' = 'day',
    from?: string,
    to?: string,
  ): Promise<TrendsResponse> {
    const params: Record<string, string> = { granularity }
    if (from) params.from = from
    if (to) params.to = to
    const { data } = await api.get<TrendsResponse>(
      `/workspaces/${workspaceId}/analytics/trends`,
      { params }
    )
    return data
  },

  async getTopExpenses(
    workspaceId: string,
    from?: string,
    to?: string,
  ): Promise<TopExpensesResponse> {
    const params: Record<string, string> = { limit: '10' }
    if (from) params.from = from
    if (to) params.to = to
    const { data } = await api.get<TopExpensesResponse>(
      `/workspaces/${workspaceId}/analytics/top-expenses`,
      { params }
    )
    return data
  },

  async getComparison(workspaceId: string): Promise<ComparisonResponse> {
    const { data } = await api.get<ComparisonResponse>(
      `/workspaces/${workspaceId}/analytics/comparison`
    )
    return data
  },

  async getCategoryTrends(
    workspaceId: string,
    from?: string,
    to?: string,
  ): Promise<CategoryTrendsResponse> {
    const params: Record<string, string> = {}
    if (from) params.from = from
    if (to) params.to = to
    const { data } = await api.get<CategoryTrendsResponse>(
      `/workspaces/${workspaceId}/analytics/category-trends`,
      { params }
    )
    return data
  },
}

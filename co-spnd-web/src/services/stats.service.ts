import api from './api'

export interface StatsByCurrency {
  currency: string
  total: number
}

export interface PlatformStats {
  users: number
  workspaces: number
  transactions: number
  totalMoney: number
  moneyByCurrency: StatsByCurrency[]
}

export async function fetchPlatformStats(): Promise<PlatformStats> {
  const { data } = await api.get<PlatformStats>('/stats')
  return data
}

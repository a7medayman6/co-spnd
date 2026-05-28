import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, BarChart2 } from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { analyticsService } from '../../services/analytics.service'
import { workspacesService } from '../../services/workspaces.service'
import type {
  Analytics,
  Workspace,
  TrendsResponse,
  TopExpensesResponse,
  ComparisonResponse,
  CategoryTrendsResponse,
} from '../../types'
import { formatCurrency, getMonthRange, getMonthLabel } from '../../utils/date'
import { Card } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { ComparisonCard } from './ComparisonCard'
import { TrendChart } from './TrendChart'
import { TopExpensesList } from './TopExpensesList'
import { CategoryTrendChart } from './CategoryTrendChart'

const CHART_COLORS = [
  '#0C0A09', '#374151', '#6B7280', '#9CA3AF',
  '#D1D5DB', '#4B5563', '#1F2937', '#F3F4F6',
]

export function AnalyticsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()

  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [monthOffset, setMonthOffset] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const [trends, setTrends] = useState<TrendsResponse | null>(null)
  const [topExpenses, setTopExpenses] = useState<TopExpensesResponse | null>(null)
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null)
  const [categoryTrends, setCategoryTrends] = useState<CategoryTrendsResponse | null>(null)
  const [granularity, setGranularity] = useState<'day' | 'month'>('day')

  const currentDate = new Date()
  currentDate.setMonth(currentDate.getMonth() + monthOffset)
  const { from, to } = getMonthRange(currentDate)
  const monthLabel = getMonthLabel(currentDate)
  const currency = workspace?.currency ?? 'USD'

  const load = useCallback(async () => {
    if (!workspaceId) return
    setIsLoading(true)
    try {
      const [data, wsList, topData, compData, catData] = await Promise.all([
        analyticsService.get(workspaceId, from, to),
        workspacesService.list(),
        analyticsService.getTopExpenses(workspaceId, from, to),
        analyticsService.getComparison(workspaceId),
        analyticsService.getCategoryTrends(workspaceId, from, to),
      ])
      setAnalytics(data)
      setWorkspace(wsList.find((w) => w.id === workspaceId) ?? null)
      setTopExpenses(topData)
      setComparison(compData)
      setCategoryTrends(catData)
    } catch {
      setAnalytics(null)
      setTopExpenses(null)
      setComparison(null)
      setCategoryTrends(null)
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId, from, to])

  const loadTrends = useCallback(async () => {
    if (!workspaceId) return
    try {
      const trendsData = await analyticsService.getTrends(workspaceId, granularity, from, to)
      setTrends(trendsData)
    } catch {
      setTrends(null)
    }
  }, [workspaceId, from, to, granularity])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    loadTrends()
  }, [loadTrends])

  const pieData = analytics?.byCategory
    .filter((c) => c.total > 0)
    .map((c) => ({ name: c.category, value: c.total })) ?? []

  const hasData = analytics && analytics.total > 0

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="px-5 pt-12 lg:pt-10 pb-5">
        <p className="text-xs font-bold tracking-[0.12em] uppercase text-[#B5ADA4]">
          {workspace?.name ?? '···'}
        </p>
        <h1 className="text-[1.75rem] font-extrabold text-[#0E0C0A] mt-1 tracking-tight">
          Analytics
        </h1>
      </div>

      {/* Month navigation */}
      <div className="px-5 mb-4">
        <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] px-4 py-3">
          <button
            onClick={() => setMonthOffset((o) => o - 1)}
            className="p-1.5 -ml-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-[15px] font-semibold text-gray-950 tracking-tight">
            {monthLabel}
          </span>
          <button
            onClick={() => setMonthOffset((o) => o + 1)}
            disabled={monthOffset >= 0}
            className="p-1.5 -mr-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      ) : !hasData ? (
        <EmptyState
          icon={<BarChart2 size={48} />}
          title="No data for this period"
          description="Add expenses to see analytics here."
        />
      ) : (
        <div className="px-5 flex flex-col gap-3 pb-8">
          {/* Total */}
          <Card>
            <p className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400 mb-1.5">
              Total spent
            </p>
            <p className="text-[2.25rem] font-money font-semibold text-gray-950 leading-none tracking-tight">
              {formatCurrency(analytics!.total, currency)}
            </p>
          </Card>

          {/* vs Last Month */}
          {comparison && <ComparisonCard data={comparison} currency={currency} />}

          {/* Spending trend */}
          <TrendChart
            data={trends}
            granularity={granularity}
            onGranularityChange={setGranularity}
            currency={currency}
          />

          {/* Pie chart */}
          {pieData.length > 0 && (
            <Card>
              <p className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400 mb-4">
                By category
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value), currency), '']}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #F3F4F6',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      fontSize: '13px',
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={7}
                    wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Category bars */}
          {analytics!.byCategory.filter((c) => c.total > 0).length > 0 && (
            <Card>
              <p className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400 mb-4">
                Breakdown
              </p>
              <div className="flex flex-col gap-3.5">
                {analytics!.byCategory
                  .filter((c) => c.total > 0)
                  .sort((a, b) => b.total - a.total)
                  .map((c) => {
                    const pct =
                      analytics!.total > 0 ? (c.total / analytics!.total) * 100 : 0
                    return (
                      <div key={c.category}>
                        <div className="flex justify-between items-baseline mb-1.5">
                          <span className="text-sm font-medium text-gray-700">{c.category}</span>
                          <span className="font-money text-sm font-semibold text-gray-950">
                            {formatCurrency(c.total, currency)}
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gray-800 rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </Card>
          )}

          {/* Category trend (top 3 by month) */}
          <CategoryTrendChart data={categoryTrends} currency={currency} />

          {/* By person */}
          {analytics!.byUser.filter((u) => u.total > 0).length > 0 && (
            <Card>
              <p className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400 mb-4">
                By person
              </p>
              <div className="flex flex-col gap-3">
                {analytics!.byUser
                  .filter((u) => u.total > 0)
                  .sort((a, b) => b.total - a.total)
                  .map((u) => (
                    <div key={u.userId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                          <span className="text-[11px] font-bold text-gray-500">
                            {u.name?.[0]?.toUpperCase() ?? '?'}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-700">{u.name}</span>
                      </div>
                      <span className="font-money text-sm font-semibold text-gray-950">
                        {formatCurrency(u.total, currency)}
                      </span>
                    </div>
                  ))}
              </div>
            </Card>
          )}

          {/* Top expenses */}
          {topExpenses && <TopExpensesList expenses={topExpenses.expenses} currency={currency} />}
        </div>
      )}
    </div>
  )
}

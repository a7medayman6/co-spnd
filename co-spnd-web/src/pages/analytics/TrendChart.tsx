import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { TrendsResponse } from '../../types'
import { formatCurrency } from '../../utils/date'
import { Card } from '../../components/ui/Card'

interface Props {
  data: TrendsResponse | null
  granularity: 'day' | 'month'
  onGranularityChange: (g: 'day' | 'month') => void
  currency: string
}

export function TrendChart({ data, granularity, onGranularityChange, currency }: Props) {
  const hasData = data && data.data.length > 0

  const formatXTick = (value: string) => {
    if (granularity === 'month') {
      const [y, m] = value.split('-')
      return new Date(+y, +m - 1, 1).toLocaleDateString('en-US', { month: 'short' })
    }
    return value.slice(5) // "MM-DD"
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400">
          Spending trend
        </p>
        <div className="flex gap-1">
          {(['day', 'month'] as const).map((g) => (
            <button
              key={g}
              onClick={() => onGranularityChange(g)}
              className={`text-[11px] font-semibold px-3 py-1 rounded-full transition-colors ${
                granularity === g
                  ? 'bg-gray-950 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {g === 'day' ? 'Daily' : 'Monthly'}
            </button>
          ))}
        </div>
      </div>

      {hasData ? (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data!.data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
            <defs>
              <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#111827" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#111827" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={formatXTick}
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatCurrency(v, currency).replace(/\.00$/, '')}
            />
            <Tooltip
              formatter={(value) => [formatCurrency(Number(value), currency), 'Spent']}
              labelStyle={{ fontSize: 12, color: '#374151' }}
              contentStyle={{
                borderRadius: '10px',
                border: '1px solid #F3F4F6',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                fontSize: '12px',
              }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#111827"
              strokeWidth={2}
              fill="url(#trendGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#111827' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-44 flex items-center justify-center text-sm text-gray-400">
          No trend data
        </div>
      )}
    </Card>
  )
}

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { CategoryTrendsResponse } from '../../types'
import { formatCurrency } from '../../utils/date'
import { Card } from '../../components/ui/Card'

function compactNumber(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`
  return String(Math.round(v))
}

interface Props {
  data: CategoryTrendsResponse | null
  currency: string
}

const CATEGORY_COLORS = ['#111827', '#6B7280', '#D1D5DB']

export function CategoryTrendChart({ data, currency }: Props) {
  if (!data || data.months.length === 0 || data.series.length === 0) return null

  const chartData = data.months.map((monthStr, i) => {
    const [yr, mo] = monthStr.split('-')
    const entry: Record<string, string | number> = {
      month: new Date(+yr, +mo - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    }
    data.series.forEach((s) => {
      entry[s.category] = s.data[i]
    })
    return entry
  })

  return (
    <Card>
      <p className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400 mb-4">
        Category trend
      </p>
      <div className="overflow-hidden">
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            width={40}
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={compactNumber}
          />
          <Tooltip
            formatter={(value, name) => [formatCurrency(Number(value), currency), name]}
            contentStyle={{
              borderRadius: '10px',
              border: '1px solid #F3F4F6',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              fontSize: '12px',
            }}
          />
          <Legend
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
          />
          {data.series.map((s, i) => (
            <Bar
              key={s.category}
              dataKey={s.category}
              fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
              radius={[3, 3, 0, 0]}
              maxBarSize={32}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      </div>
    </Card>
  )
}

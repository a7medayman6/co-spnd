import type { ComparisonResponse } from '../../types'
import { formatCurrency } from '../../utils/date'
import { Card } from '../../components/ui/Card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Props {
  data: ComparisonResponse
  currency: string
}

export function ComparisonCard({ data, currency }: Props) {
  const isIncrease = data.delta > 0
  const isNeutral = data.delta === 0
  const percentAbs = data.deltaPercent !== null ? Math.abs(data.deltaPercent) : null

  const badgeClass = isNeutral
    ? 'bg-gray-100 text-gray-500'
    : isIncrease
      ? 'bg-red-50 text-red-600'
      : 'bg-green-50 text-green-600'

  const Icon = isNeutral ? Minus : isIncrease ? TrendingUp : TrendingDown

  return (
    <Card>
      <p className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400 mb-3">
        vs Last Month
      </p>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">This month</p>
          <p className="font-money text-xl font-semibold text-gray-950">
            {formatCurrency(data.current.total, currency)}
          </p>
        </div>

        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
          <Icon size={12} />
          {percentAbs !== null ? `${percentAbs}%` : '—'}
        </div>

        <div className="text-right">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Last month</p>
          <p className="font-money text-xl font-semibold text-gray-400">
            {formatCurrency(data.previous.total, currency)}
          </p>
        </div>
      </div>
    </Card>
  )
}

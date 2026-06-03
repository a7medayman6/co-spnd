import type { TopExpense } from '../../types'
import { formatCurrency, formatDate } from '../../utils/date'
import { Card } from '../../components/ui/Card'

interface Props {
  expenses: TopExpense[]
  currency: string
}

export function TopExpensesList({ expenses, currency }: Props) {
  if (expenses.length === 0) return null

  return (
    <Card>
      <p className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400 mb-4">
        Top expenses
      </p>
      <div className="flex flex-col gap-3.5">
        {expenses.map((expense, i) => (
          <div key={expense.id} className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-300 w-4 shrink-0">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {(expense.description || expense.category).slice(0, 40)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">
                {expense.spenderName} · {formatDate(expense.date)}
              </p>
            </div>
            <p className="font-money text-sm font-semibold text-gray-950 shrink-0">
              {formatCurrency(expense.amount, currency)}
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}

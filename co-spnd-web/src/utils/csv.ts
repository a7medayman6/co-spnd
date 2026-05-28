import type { Transaction } from '../types'

export function exportTransactionsToCsv(
  transactions: Transaction[],
  currency: string,
  filename: string,
): void {
  const header = ['Date', 'Amount', 'Currency', 'Category', 'Description', 'Spender']
  const rows = transactions.map((t) => [
    t.date.slice(0, 10),
    t.amount.toString(),
    currency,
    t.category,
    t.description ?? '',
    t.spenderName ?? '',
  ])

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

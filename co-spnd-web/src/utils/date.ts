export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function getMonthRange(date: Date = new Date()): { from: string; to: string } {
  const year = date.getFullYear()
  const month = date.getMonth()
  const from = new Date(year, month, 1).toISOString().split('T')[0]
  const to = new Date(year, month + 1, 0).toISOString().split('T')[0]
  return { from, to }
}

export function toInputDateValue(dateStr?: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0]
  return new Date(dateStr).toISOString().split('T')[0]
}

export function getMonthLabel(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

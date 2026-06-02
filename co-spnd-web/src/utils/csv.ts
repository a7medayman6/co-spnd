import type { Transaction } from '../types'

export function exportTransactionsToCsv(
  transactions: Transaction[],
  currency: string,
  filename: string,
): void {
  const header = ['Date', 'Amount', 'Currency', 'Category', 'Description', 'Spender', 'PaymentMethod']
  const rows = transactions.map((t) => [
    t.date.slice(0, 10),
    t.amount.toString(),
    currency,
    t.category,
    t.description ?? '',
    t.spenderName ?? '',
    t.paymentMethod ?? 'CASH',
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

export interface ParsedCsvRow {
  date: string       // YYYY-MM-DD
  description: string
  amount: number
  category: string
  paymentMethod?: 'CASH' | 'VISA'
}

export interface CsvParseError {
  row: number        // 1-indexed data row (excludes header)
  message: string
}

export interface CsvParseResult {
  rows: ParsedCsvRow[]
  errors: CsvParseError[]
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

export function parseImportCsv(text: string): CsvParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (lines.length < 2) {
    return { rows: [], errors: [{ row: 0, message: 'File is empty or has no data rows' }] }
  }

  const headerCells = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, ''))
  const colIndex = (name: string) => headerCells.indexOf(name)

  const dateIdx = colIndex('date')
  const descIdx = colIndex('description')
  const amountIdx = colIndex('amount')
  const categoryIdx = colIndex('category')
  const paymentMethodIdx = colIndex('paymentmethod')

  if (dateIdx === -1 || amountIdx === -1 || categoryIdx === -1) {
    return {
      rows: [],
      errors: [{ row: 0, message: 'CSV must have Date, Amount, and Category columns' }],
    }
  }

  const rows: ParsedCsvRow[] = []
  const errors: CsvParseError[] = []

  for (let i = 1; i < lines.length; i++) {
    const dataRow = i // 1-indexed data row number
    const cells = parseCsvLine(lines[i])

    const rawAmount = cells[amountIdx] ?? ''
    const rawDate = cells[dateIdx] ?? ''
    const rawCategory = cells[categoryIdx] ?? ''
    const rawDescription = descIdx !== -1 ? (cells[descIdx] ?? '') : ''
    const rawPaymentMethod = paymentMethodIdx !== -1 ? (cells[paymentMethodIdx] ?? '') : ''

    const amount = parseFloat(rawAmount)
    if (isNaN(amount) || amount <= 0) {
      errors.push({ row: dataRow, message: `Row ${dataRow}: invalid amount "${rawAmount}"` })
      continue
    }

    const dateValue = rawDate.trim()
    if (!dateValue || isNaN(Date.parse(dateValue))) {
      errors.push({ row: dataRow, message: `Row ${dataRow}: invalid date "${rawDate}"` })
      continue
    }

    // Normalize date to YYYY-MM-DD
    const date = new Date(dateValue).toISOString().slice(0, 10)

    const category = rawCategory.trim()
    if (!category) {
      errors.push({ row: dataRow, message: `Row ${dataRow}: missing category` })
      continue
    }

    // Skip rows with 'null' description (exported as string "null")
    const description = rawDescription === 'null' ? '' : rawDescription.trim()

    const pm = rawPaymentMethod.trim().toUpperCase()
    const paymentMethod: 'CASH' | 'VISA' | undefined =
      pm === 'VISA' ? 'VISA' : pm === 'CASH' ? 'CASH' : undefined

    rows.push({ date, description, amount, category, paymentMethod })
  }

  return { rows, errors }
}

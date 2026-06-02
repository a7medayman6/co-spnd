# Export — Design Spec

**Date:** 2026-05-28  
**Status:** Approved  
**Scope:** Frontend only — no backend changes required

---

## Overview

Add a CSV export button to the TransactionsPage that downloads all currently-displayed transactions as a `.csv` file. The TransactionsPage has no month filter — it loads all workspace transactions — so the export covers the full history. Data is already in client state — no new API calls needed.

---

## Implementation

### New utility: `src/utils/csv.ts`

```typescript
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
  link.click()
  URL.revokeObjectURL(url)
}
```

- Wraps each cell in double quotes and escapes internal double quotes (`""`) per RFC 4180.
- `spenderName` is already populated on the Transaction type (optional).

---

### TransactionsPage update (`src/pages/transactions/TransactionsPage.tsx`)

**Import:**
```typescript
import { Download } from 'lucide-react'
import { exportTransactionsToCsv } from '../../utils/csv'
```

**Handler:**
```typescript
function handleExport() {
  const today = new Date().toISOString().slice(0, 10)
  const safeName = (workspace?.name ?? 'workspace').replace(/\s+/g, '-')
  const filename = `co-spnd-${safeName}-${today}.csv`
  exportTransactionsToCsv(transactions, workspace?.currency ?? 'USD', filename)
}
```

`workspace` and `transactions` are both already in state on `TransactionsPage`.

**Button:** add to header area next to the month navigation — a small icon-only button using the existing `Button` component or a plain `<button>`:

```tsx
<button
  onClick={handleExport}
  disabled={transactions.length === 0}
  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
  aria-label="Export CSV"
>
  <Download size={18} />
</button>
```

Place it in the header row alongside the workspace name / month title area — consistent with the app's existing icon button style.

---

## CSV Format

```
"Date","Amount","Currency","Category","Description","Spender"
"2026-05-01","120.5","AED","Food","Dinner","Ahmed"
"2026-05-03","45","AED","Transportation","","Sara"
```

- All cells quoted per RFC 4180
- `Description` empty string when null
- `Spender` empty string when null

---

## Out of Scope

- PDF export
- Custom date range picker (exports current month view)
- Server-side export endpoint
- Excel (`.xlsx`) format
- Bulk export across multiple months

---

## Success Criteria

- Clicking the download icon generates a `.csv` file and triggers browser download
- Button is disabled (visually dimmed) when no transactions in current month
- CSV opens correctly in spreadsheet apps (Excel, Google Sheets, Numbers)
- Filename reflects workspace name and month
- No TypeScript errors, no new dependencies

import { useState, useRef, useEffect } from 'react'
import { Plus, Clipboard, X, AlertCircle } from 'lucide-react'
import { transactionsService } from '../../services/transactions.service'
import { workspacesService } from '../../services/workspaces.service'
import { CATEGORIES } from '../../types'
import { Button } from '../../components/ui/Button'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { cacheGet, cacheSet } from '../../utils/cache'

interface BulkRow {
  id: string
  amount: string
  category: string
  description: string
  paymentMethod: 'CASH' | 'VISA'
  error?: string
}

interface BulkAddTransactionsSheetProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
  currency: string
  onAdded: (count: number) => void
}

function makeRow(): BulkRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    amount: '',
    category: 'Other',
    description: '',
    paymentMethod: 'VISA',
  }
}

function splitFields(line: string): string[] {
  // Split on commas up to 4 fields; the rest of the line goes into the 3rd field (description)
  const parts: string[] = []
  let remaining = line
  for (let i = 0; i < 3; i++) {
    const idx = remaining.indexOf(',')
    if (idx === -1) break
    parts.push(remaining.slice(0, idx).trim())
    remaining = remaining.slice(idx + 1)
  }
  parts.push(remaining.trim())
  return parts
}

function matchCategory(raw: string, allCategories: string[]): string {
  const trimmed = raw.trim()
  if (!trimmed) return 'Other'
  const lower = trimmed.toLowerCase()
  return allCategories.find((c) => c.toLowerCase() === lower) ?? 'Other'
}

function parsePastedText(text: string, allCategories: string[]): { rows: BulkRow[]; skipped: number } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  let skipped = 0
  const rows: BulkRow[] = []

  for (const line of lines) {
    const parts = splitFields(line)
    const rawAmount = parts[0] ?? ''
    const rawCategory = parts[1] ?? ''
    const rawDescription = parts[2] ?? ''
    const rawPayment = (parts[3] ?? '').trim().toLowerCase()

    const parsed = parseFloat(rawAmount)
    if (!rawAmount.trim() || isNaN(parsed) || parsed <= 0) {
      skipped++
      continue
    }

    const category = matchCategory(rawCategory, allCategories)
    const paymentMethod: 'CASH' | 'VISA' = rawPayment === 'cash' ? 'CASH' : 'VISA'

    rows.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      amount: String(parsed),
      category,
      description: rawDescription,
      paymentMethod,
    })
  }

  return { rows, skipped }
}

export function BulkAddTransactionsSheet({
  isOpen,
  onClose,
  workspaceId,
  currency,
  onAdded,
}: BulkAddTransactionsSheetProps) {
  const [rows, setRows] = useState<BulkRow[]>([makeRow(), makeRow(), makeRow()])
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [showPasteArea, setShowPasteArea] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [pasteSkipped, setPasteSkipped] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const pasteRef = useRef<HTMLTextAreaElement>(null)

  const allCategories = [...CATEGORIES, ...customCategories]

  useEffect(() => {
    if (isOpen) {
      const cached = cacheGet<string[]>(`workspace:${workspaceId}:categories`)
      if (cached) setCustomCategories(cached)
      workspacesService
        .getCategories(workspaceId)
        .then((c) => {
          setCustomCategories(c)
          cacheSet(`workspace:${workspaceId}:categories`, c)
        })
        .catch(() => {})
    }
  }, [isOpen, workspaceId])

  useEffect(() => {
    if (showPasteArea) {
      setTimeout(() => pasteRef.current?.focus(), 50)
    }
  }, [showPasteArea])

  function reset() {
    setRows([makeRow(), makeRow(), makeRow()])
    setShowPasteArea(false)
    setPasteText('')
    setPasteSkipped(null)
    setGlobalError('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  function updateRow(id: string, patch: Partial<BulkRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch, error: undefined } : r)))
  }

  function removeRow(id: string) {
    setRows((prev) => {
      const next = prev.filter((r) => r.id !== id)
      return next.length === 0 ? [makeRow()] : next
    })
  }

  function addRow() {
    setRows((prev) => [...prev, makeRow()])
  }

  async function handleClipboardPaste() {
    try {
      const text = await navigator.clipboard.readText()
      if (text.trim()) {
        applyPastedText(text)
      } else {
        setShowPasteArea(true)
      }
    } catch {
      setShowPasteArea(true)
    }
  }

  function applyPastedText(text: string) {
    const { rows: parsed, skipped } = parsePastedText(text, allCategories)
    if (parsed.length === 0) {
      setGlobalError('No valid rows found in pasted text. Rows need at least a positive amount.')
      return
    }
    setRows((prev) => {
      // Replace empty rows with parsed rows, then append any remaining parsed rows
      const nonEmpty = prev.filter((r) => r.amount.trim() !== '')
      return [...nonEmpty, ...parsed]
    })
    setPasteSkipped(skipped)
    setShowPasteArea(false)
    setPasteText('')
    setGlobalError('')
  }

  async function handleSubmit() {
    setGlobalError('')
    let hasErrors = false

    const validated = rows.map((row) => {
      const parsed = parseFloat(row.amount)
      if (!row.amount.trim() || isNaN(parsed) || parsed <= 0) {
        hasErrors = true
        return { ...row, error: 'Enter a valid amount' }
      }
      return { ...row, error: undefined }
    })

    if (hasErrors) {
      setRows(validated)
      setGlobalError('Fix the highlighted rows before submitting.')
      return
    }

    const validRows = rows.filter((r) => {
      const v = parseFloat(r.amount)
      return !isNaN(v) && v > 0
    })

    if (validRows.length === 0) {
      setGlobalError('Add at least one transaction.')
      return
    }

    setIsLoading(true)
    try {
      const result = await transactionsService.importTransactions(
        workspaceId,
        validRows.map((r) => ({
          amount: parseFloat(r.amount),
          category: r.category,
          description: r.description.trim() || undefined,
          paymentMethod: r.paymentMethod,
        })),
      )
      onAdded(result.imported)
      handleClose()
    } catch {
      setGlobalError('Failed to submit. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const currencySymbol = (() => {
    try {
      return (
        new Intl.NumberFormat('en-US', { style: 'currency', currency })
          .formatToParts(0)
          .find((p) => p.type === 'currency')?.value ?? currency
      )
    } catch {
      return currency
    }
  })()

  const filledCount = rows.filter((r) => r.amount.trim() && parseFloat(r.amount) > 0).length

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title="Add multiple">
      <div className="flex flex-col gap-5 pb-28">

        {/* ── Paste section ──────────────────────────────────────── */}
        {!showPasteArea && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleClipboardPaste}
              className="flex items-center gap-2.5 w-full px-4 py-3 bg-[#F3F0FF] border border-[#DDD5FF] rounded-2xl text-left hover:bg-[#EBE5FF] transition-colors active:scale-[0.98]"
            >
              <Clipboard size={16} className="text-[#863bff] shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-[#863bff]">Paste multiple transactions</span>
                <span className="text-[11px] text-[#9B7FE0] mt-0.5">
                  One per line: amount, category, description, visa or cash
                </span>
              </div>
            </button>
            {pasteSkipped !== null && pasteSkipped > 0 && (
              <p className="text-xs text-amber-600 font-medium px-1">
                {pasteSkipped} line{pasteSkipped !== 1 ? 's' : ''} skipped (missing or invalid amount).
              </p>
            )}
          </div>
        )}

        {showPasteArea && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400">
              Paste rows
            </label>
            <p className="text-[11px] text-gray-400 -mt-1">
              One per line: <span className="font-mono">amount, category, description, visa or cash</span>
            </p>
            <textarea
              ref={pasteRef}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={`e.g.\n120, Food, Lunch, visa\n50, Transport, Uber, cash\n200, Shopping,, visa`}
              rows={5}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-800 outline-none focus:border-[#863bff] focus:ring-2 focus:ring-[#F3F0FF] transition-all resize-none leading-relaxed font-mono"
            />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { setShowPasteArea(false); setPasteText('') }}
                className="flex-1"
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={() => applyPastedText(pasteText)}
                disabled={!pasteText.trim()}
                className="flex-1 py-2 px-4 bg-[#863bff] text-white text-sm font-semibold rounded-xl disabled:opacity-40 hover:bg-[#7333e0] transition-colors active:scale-95"
              >
                Add rows
              </button>
            </div>
          </div>
        )}

        {/* ── Column headers ─────────────────────────────────────── */}
        <div className="overflow-x-auto -mx-1 px-1">
          <div style={{ minWidth: 520 }}>
            {/* Header */}
            <div className="grid gap-1.5 px-1 mb-1" style={{ gridTemplateColumns: '88px 1fr 1fr 80px 32px' }}>
              <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-gray-400">
                {currencySymbol} Amount
              </span>
              <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-gray-400">
                Category
              </span>
              <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-gray-400">
                Description
              </span>
              <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-gray-400">
                Payment
              </span>
              <span />
            </div>

            {/* Rows */}
            <div className="flex flex-col gap-2">
              {rows.map((row) => (
                <div key={row.id} className="flex flex-col gap-1">
                  <div
                    className={`grid gap-1.5 items-center px-1 ${row.error ? 'opacity-100' : ''}`}
                    style={{ gridTemplateColumns: '88px 1fr 1fr 80px 32px' }}
                  >
                    {/* Amount */}
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={row.amount}
                      onChange={(e) => updateRow(row.id, { amount: e.target.value })}
                      className={`w-full px-2.5 py-2.5 rounded-xl border text-sm font-money font-semibold text-gray-950 bg-white outline-none transition-all ${
                        row.error
                          ? 'border-red-300 ring-2 ring-red-100 bg-red-50'
                          : 'border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-100'
                      }`}
                    />

                    {/* Category */}
                    <select
                      value={row.category}
                      onChange={(e) => updateRow(row.id, { category: e.target.value })}
                      className="w-full px-2.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-950 bg-white outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all"
                    >
                      {allCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>

                    {/* Description */}
                    <input
                      type="text"
                      placeholder="Optional"
                      value={row.description}
                      onChange={(e) => updateRow(row.id, { description: e.target.value })}
                      className="w-full px-2.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all placeholder:text-gray-300"
                    />

                    {/* Payment toggle */}
                    <div className="flex bg-gray-100 rounded-xl p-0.5 gap-0.5">
                      {(['CASH', 'VISA'] as const).map((pm) => (
                        <button
                          key={pm}
                          type="button"
                          onClick={() => updateRow(row.id, { paymentMethod: pm })}
                          className={`flex-1 py-2 text-[11px] font-semibold rounded-[10px] transition-all ${
                            row.paymentMethod === pm
                              ? 'bg-white text-gray-950 shadow-sm'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {pm === 'CASH' ? 'Cash' : 'Visa'}
                        </button>
                      ))}
                    </div>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Row error */}
                  {row.error && (
                    <div className="flex items-center gap-1.5 px-1">
                      <AlertCircle size={12} className="text-red-400 shrink-0" />
                      <span className="text-xs text-red-500">{row.error}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add row */}
            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-2 mt-3 px-2 py-2 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Plus size={14} />
              Add row
            </button>
          </div>
        </div>
      </div>

      {/* ── Sticky footer ──────────────────────────────────────── */}
      <div className="sticky bottom-0 -mx-5 px-5 pt-3 pb-2 bg-white border-t border-gray-100 shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
        {globalError && (
          <p className="text-sm text-red-500 font-medium bg-red-50 px-4 py-2.5 rounded-xl mb-3">
            {globalError}
          </p>
        )}
        <Button onClick={handleSubmit} isLoading={isLoading} size="lg" className="w-full">
          {filledCount > 0
            ? `Submit ${filledCount} transaction${filledCount !== 1 ? 's' : ''}`
            : 'Submit'}
        </Button>
      </div>
    </BottomSheet>
  )
}

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, ChevronUp, Clipboard, X, AlertTriangle, Sparkles } from 'lucide-react'
import { transactionsService } from '../../services/transactions.service'
import { workspacesService } from '../../services/workspaces.service'
import { useAuth } from '../../hooks/useAuth'
import type { Transaction, WorkspaceMember } from '../../types'
import { CATEGORIES } from '../../types'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { toInputDateValue } from '../../utils/date'
import { parseMessage, getParserKeywords } from '../../utils/messageParser'

interface AddTransactionSheetProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
  currency: string
  onAdded: (tx: Transaction) => void
  openWithPaste?: boolean
}

export function AddTransactionSheet({
  isOpen,
  onClose,
  workspaceId,
  currency,
  onAdded,
  openWithPaste = false,
}: AddTransactionSheetProps) {
  const { user } = useAuth()
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<string>(CATEGORIES[0])
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(toInputDateValue())
  const [spenderId, setSpenderId] = useState('')
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [showMore, setShowMore] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // paste-to-fill state
  const [parsedFrom, setParsedFrom] = useState(false)
  const [isCreditWarning, setIsCreditWarning] = useState(false)
  const [showPasteArea, setShowPasteArea] = useState(false)
  const [pasteText, setPasteText] = useState('')

  const pasteRef = useRef<HTMLTextAreaElement>(null)
  const descriptionRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && user) {
      setSpenderId(user.id)
      workspacesService.getMembers(workspaceId).then(setMembers).catch(() => {})
    }
  }, [isOpen, workspaceId, user])

  useEffect(() => {
    if (showPasteArea) {
      setTimeout(() => pasteRef.current?.focus(), 50)
    }
  }, [showPasteArea])

  // Auto-trigger paste flow when opened via the clipboard shortcut
  useEffect(() => {
    if (isOpen && openWithPaste) {
      setTimeout(() => handleClipboardPaste(), 100)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, openWithPaste])

  function applyParsed(text: string) {
    if (!text.trim()) return
    const result = parseMessage(text, getParserKeywords())
    if (result.amount !== null) setAmount(result.amount.toString())
    setCategory(result.category)
    if (result.description) setDescription(result.description)
    setDate(result.date)
    setParsedFrom(true)
    setIsCreditWarning(result.isCredit)
    setShowPasteArea(false)
    setPasteText('')
    if (result.amount === null) setError('Could not detect an amount. Please enter it manually.')
  }

  async function handleClipboardPaste() {
    try {
      const text = await navigator.clipboard.readText()
      if (text.trim()) {
        applyParsed(text)
      } else {
        setShowPasteArea(true)
      }
    } catch {
      setShowPasteArea(true)
    }
  }

  function clearParsed() {
    setParsedFrom(false)
    setIsCreditWarning(false)
    setAmount('')
    setCategory(CATEGORIES[0])
    setDescription('')
    setDate(toInputDateValue())
  }

  function reset() {
    setAmount('')
    setCategory(CATEGORIES[0])
    setDescription('')
    setDate(toInputDateValue())
    setSpenderId(user?.id ?? '')
    setShowMore(false)
    setError('')
    setParsedFrom(false)
    setIsCreditWarning(false)
    setShowPasteArea(false)
    setPasteText('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit() {
    const parsed = parseFloat(amount)
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError('Enter a valid amount.')
      return
    }
    setError('')
    setIsLoading(true)
    try {
      const tx = await transactionsService.create(workspaceId, {
        amount: parsed,
        category,
        description: description.trim() || undefined,
        date,
        spenderId: spenderId || undefined,
      })
      onAdded(tx)
      handleClose()
    } catch {
      setError('Failed to add transaction.')
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

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title="Add expense">
      {/* Scrollable form body — extra bottom padding so content clears the sticky button */}
      <div className="flex flex-col gap-5 pb-24">

        {/* ── Paste-to-fill zone ─────────────────────────────────── */}
        {!parsedFrom && !showPasteArea && (
          <button
            type="button"
            onClick={handleClipboardPaste}
            className="flex items-center gap-2.5 w-full px-4 py-3 bg-[#F3F0FF] border border-[#DDD5FF] rounded-2xl text-left hover:bg-[#EBE5FF] transition-colors active:scale-[0.98]"
          >
            <Clipboard size={16} className="text-[#863bff] shrink-0" />
            <span className="text-sm font-semibold text-[#863bff]">Paste a bank message to auto-fill</span>
          </button>
        )}

        {/* Paste textarea fallback */}
        {showPasteArea && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400">
              Paste your message
            </label>
            <textarea
              ref={pasteRef}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={'e.g. "Your account was debited EGP 245.50 at Costa Coffee on 28-May-2026"'}
              rows={4}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-800 outline-none focus:border-[#863bff] focus:ring-2 focus:ring-[#F3F0FF] transition-all resize-none leading-relaxed"
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
                onClick={() => applyParsed(pasteText)}
                disabled={!pasteText.trim()}
                className="flex-1 py-2 px-4 bg-[#863bff] text-white text-sm font-semibold rounded-xl disabled:opacity-40 hover:bg-[#7333e0] transition-colors active:scale-95"
              >
                Fill fields
              </button>
            </div>
          </div>
        )}

        {/* Parsed badge */}
        {parsedFrom && (
          <div className="flex items-start gap-2.5 px-4 py-3 bg-[#F3F0FF] border border-[#DDD5FF] rounded-2xl">
            <Sparkles size={15} className="text-[#863bff] shrink-0 mt-0.5" />
            <p className="text-sm text-[#5A3DB5] font-medium flex-1">Fields filled from message — review before saving.</p>
            <button onClick={clearParsed} className="text-[#863bff] hover:text-[#5A3DB5] transition-colors shrink-0">
              <X size={15} />
            </button>
          </div>
        )}

        {/* Credit warning */}
        {isCreditWarning && (
          <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
            <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 font-medium">
              This looks like a credit or refund. Log it anyway?
            </p>
          </div>
        )}

        {/* ── Amount ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400">
            Amount
          </label>
          <div className="relative flex items-center bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-gray-100 transition-all duration-150">
            <span className="pl-4 text-2xl text-gray-400 font-money select-none">
              {currencySymbol}
            </span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (showMore) {
                    descriptionRef.current?.focus()
                  } else {
                    ;(e.target as HTMLInputElement).blur()
                  }
                }
              }}
              className="flex-1 px-2 py-4 text-4xl font-money font-semibold text-gray-950 bg-transparent outline-none placeholder-gray-200 min-w-0"
            />
          </div>
        </div>

        {/* ── Category chips ──────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400">
            Category
          </label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all duration-150 active:scale-95 ${
                  category === cat
                    ? 'bg-gray-950 text-white border-gray-950 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── More details ────────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-400 hover:text-gray-600 self-start transition-colors"
        >
          {showMore ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          {showMore ? 'Less details' : 'More details'}
        </button>

        {showMore && (
          <div className="flex flex-col gap-4 pt-1 border-t border-gray-100">
            <Input
              ref={descriptionRef}
              label="Description"
              placeholder="What was this for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            {members.length > 1 && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-600 tracking-tight">
                  Paid by
                </label>
                <select
                  value={spenderId}
                  onChange={(e) => setSpenderId(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-gray-950 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all duration-150"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}{m.id === user?.id ? ' (you)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Sticky submit footer ────────────────────────────────── */}
      <div className="sticky bottom-0 -mx-5 px-5 pt-3 pb-2 bg-white border-t border-gray-100 shadow-[0_-4px_16px_rgba(0,0,0,0.05)]">
        {error && (
          <p className="text-sm text-red-500 font-medium bg-red-50 px-4 py-2.5 rounded-xl mb-3">
            {error}
          </p>
        )}
        <Button onClick={handleSubmit} isLoading={isLoading} size="lg" className="w-full">
          Add expense
        </Button>
      </div>
    </BottomSheet>
  )
}

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { transactionsService } from '../../services/transactions.service'
import { workspacesService } from '../../services/workspaces.service'
import { useAuth } from '../../hooks/useAuth'
import type { Transaction, WorkspaceMember } from '../../types'
import { CATEGORIES } from '../../types'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { toInputDateValue } from '../../utils/date'

interface AddTransactionSheetProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
  currency: string
  onAdded: (tx: Transaction) => void
}

export function AddTransactionSheet({
  isOpen,
  onClose,
  workspaceId,
  currency,
  onAdded,
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

  useEffect(() => {
    if (isOpen && user) {
      setSpenderId(user.id)
      workspacesService.getMembers(workspaceId).then(setMembers).catch(() => {})
    }
  }, [isOpen, workspaceId, user])

  function reset() {
    setAmount('')
    setCategory(CATEGORIES[0])
    setDescription('')
    setDate(toInputDateValue())
    setSpenderId(user?.id ?? '')
    setShowMore(false)
    setError('')
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

  // Currency symbol for display
  const currencySymbol = (() => {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency })
        .formatToParts(0)
        .find((p) => p.type === 'currency')?.value ?? currency
    } catch {
      return currency
    }
  })()

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title="Add expense">
      <div className="flex flex-col gap-5">
        {/* Amount — hero input */}
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
              className="flex-1 px-2 py-4 text-4xl font-money font-semibold text-gray-950 bg-transparent outline-none placeholder-gray-200 min-w-0"
            />
          </div>
        </div>

        {/* Category chips */}
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

        {/* More details accordion */}
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

        {error && (
          <p className="text-sm text-red-500 font-medium bg-red-50 px-4 py-2.5 rounded-xl">
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

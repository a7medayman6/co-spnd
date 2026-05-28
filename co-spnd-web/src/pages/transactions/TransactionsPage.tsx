import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Trash2, Pencil, Receipt, Download, ChevronLeft, ChevronRight, SlidersHorizontal, X } from 'lucide-react'
import { transactionsService } from '../../services/transactions.service'
import { workspacesService } from '../../services/workspaces.service'
import { analyticsService } from '../../services/analytics.service'
import { exportTransactionsToCsv } from '../../utils/csv'
import { getBudget } from '../../utils/budget'
import { useAuth } from '../../hooks/useAuth'
import type { Transaction, Workspace, WorkspaceMember, UpdateTransactionDto } from '../../types'
import { CATEGORIES } from '../../types'
import { formatCurrency, formatDate, toInputDateValue, getMonthRange, getMonthLabel } from '../../utils/date'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { AddTransactionSheet } from './AddTransactionSheet'

function BudgetBar({ spent, budget, currency }: { spent: number; budget: number; currency: string }) {
  const pct = Math.min((spent / budget) * 100, 100)
  const over = spent > budget

  let barColor = 'bg-emerald-500'
  if (pct >= 100) barColor = 'bg-red-500'
  else if (pct >= 80) barColor = 'bg-orange-400'
  else if (pct >= 50) barColor = 'bg-amber-400'

  return (
    <div className="mt-3">
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-xs font-medium text-gray-400">
          {over ? 'Over budget' : `${Math.round(pct)}% of budget`}
        </span>
        <span className="text-xs font-medium text-gray-400">
          {formatCurrency(budget, currency)}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function TransactionsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editTarget, setEditTarget] = useState<Transaction | null>(null)
  const [editForm, setEditForm] = useState<UpdateTransactionDto>({})
  const [editLoading, setEditLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [monthOffset, setMonthOffset] = useState(0)
  const [deltaPercent, setDeltaPercent] = useState<number | null | undefined>(undefined)
  const [budget, setBudget] = useState<number | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filterCategory, setFilterCategory] = useState('')
  const [filterSpenderId, setFilterSpenderId] = useState('')

  const selectedDate = new Date()
  selectedDate.setMonth(selectedDate.getMonth() + monthOffset)
  const { from, to } = getMonthRange(selectedDate)
  const monthLabel = getMonthLabel(selectedDate)
  const isCurrentMonth = monthOffset === 0

  const load = useCallback(async () => {
    if (!workspaceId) return
    const [txs, wsList, memberList] = await Promise.all([
      transactionsService.list(workspaceId, from, to),
      workspacesService.list(),
      workspacesService.getMembers(workspaceId),
    ])
    setTransactions(txs)
    setMembers(memberList)
    const ws = wsList.find((w) => w.id === workspaceId) ?? null
    setWorkspace(ws)
    setBudget(ws ? getBudget(workspaceId) : null)
  }, [workspaceId, from, to])

  const loadComparison = useCallback(async () => {
    if (!workspaceId || !isCurrentMonth) {
      setDeltaPercent(undefined)
      return
    }
    try {
      const prevDate = new Date()
      prevDate.setMonth(prevDate.getMonth() - 1)
      const { from: pFrom, to: pTo } = getMonthRange(prevDate)
      const [currAnalytics, prevAnalytics] = await Promise.all([
        analyticsService.get(workspaceId, from, to),
        analyticsService.get(workspaceId, pFrom, pTo),
      ])
      if (prevAnalytics.total === 0) {
        setDeltaPercent(null)
      } else {
        setDeltaPercent(
          ((currAnalytics.total - prevAnalytics.total) / prevAnalytics.total) * 100
        )
      }
    } catch {
      setDeltaPercent(undefined)
    }
  }, [workspaceId, from, to, isCurrentMonth])

  useEffect(() => {
    setIsLoading(true)
    load().finally(() => setIsLoading(false))
  }, [load])

  useEffect(() => {
    loadComparison()
  }, [loadComparison])

  function handleAdded(tx: Transaction) {
    // Only add to the list if it falls within the current viewed month
    const txDate = new Date(tx.date)
    const viewStart = new Date(from)
    const viewEnd = new Date(to)
    if (txDate >= viewStart && txDate <= viewEnd) {
      setTransactions((prev) => [tx, ...prev])
    }
  }

  function openEdit(tx: Transaction) {
    setEditTarget(tx)
    setEditForm({
      amount: tx.amount,
      category: tx.category,
      description: tx.description ?? '',
      date: toInputDateValue(tx.date),
      spenderId: tx.spenderId,
    })
  }

  async function handleEdit() {
    if (!editTarget) return
    setEditLoading(true)
    try {
      const updated = await transactionsService.update(editTarget.id, editForm)
      setTransactions((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      setEditTarget(null)
    } catch {
      // keep modal open, user can retry
    } finally {
      setEditLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await transactionsService.delete(deleteTarget.id)
      setTransactions((prev) => prev.filter((t) => t.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch {
      // keep modal open
    } finally {
      setDeleteLoading(false)
    }
  }

  function handleExport() {
    const safeName = (workspace?.name ?? 'workspace').replace(/\s+/g, '-')
    const filename = `co-spnd-${safeName}-${from}.csv`
    exportTransactionsToCsv(filteredTransactions, workspace?.currency ?? 'USD', filename)
  }

  const filteredTransactions = transactions.filter((t) => {
    if (filterCategory && t.category !== filterCategory) return false
    if (filterSpenderId && t.spenderId !== filterSpenderId) return false
    return true
  })

  const activeFilterCount = (filterCategory ? 1 : 0) + (filterSpenderId ? 1 : 0)

  const total = filteredTransactions.reduce((sum, t) => sum + t.amount, 0)
  const currency = workspace?.currency ?? 'USD'

  const deltaLabel = (() => {
    if (deltaPercent === undefined || deltaPercent === null) return null
    const abs = Math.abs(deltaPercent)
    const sign = deltaPercent > 0 ? '+' : '-'
    const color = deltaPercent > 0 ? 'text-red-500' : 'text-emerald-600'
    return (
      <span className={`text-xs font-semibold ${color}`}>
        {sign}{abs.toFixed(1)}% vs last month
      </span>
    )
  })()

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="px-5 pt-5 lg:pt-10 pb-4 flex items-start justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.12em] uppercase text-[#B5ADA4]">
            {workspace?.name ?? '···'}
          </p>
          <h1 className="text-[1.75rem] font-extrabold text-[#0E0C0A] mt-1 tracking-tight">
            Expenses
          </h1>
          {transactions.length > 0 && (
            <div className="mt-1">
              <p className="text-sm text-[#8C8479]">
                Total:{' '}
                <span className="font-money font-semibold text-[#0E0C0A]">
                  {formatCurrency(total, currency)}
                </span>
              </p>
              {deltaLabel && <div className="mt-0.5">{deltaLabel}</div>}
              {budget !== null && (
                <BudgetBar spent={total} budget={budget} currency={currency} />
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 mt-4">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`relative p-1.5 rounded-xl transition-colors ${showFilters || activeFilterCount > 0 ? 'text-[#0E0C0A] bg-[#EDE9E1]' : 'text-[#B5ADA4] hover:text-[#8C8479] hover:bg-[#F2F0EB]'}`}
            aria-label="Filters"
          >
            <SlidersHorizontal size={18} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#0E0C0A] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            onClick={handleExport}
            disabled={filteredTransactions.length === 0}
            className="p-1.5 text-[#B5ADA4] hover:text-[#8C8479] hover:bg-[#F2F0EB] rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Export CSV"
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Month navigation */}
      <div className="px-5 mb-4">
        <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] px-4 py-3">
          <button
            onClick={() => setMonthOffset((o) => o - 1)}
            className="p-1.5 -ml-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-[15px] font-semibold text-gray-950 tracking-tight">
            {monthLabel}
          </span>
          <button
            onClick={() => setMonthOffset((o) => o + 1)}
            disabled={monthOffset >= 0}
            className="p-1.5 -mr-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="px-5 mb-4">
          <div className="bg-white rounded-2xl border border-[#EDE9E1] shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-[0.1em] uppercase text-[#B5ADA4]">Filters</span>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => { setFilterCategory(''); setFilterSpenderId('') }}
                  className="flex items-center gap-1 text-xs font-semibold text-[#8C8479] hover:text-[#0E0C0A] transition-colors"
                >
                  <X size={12} /> Clear all
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#8C8479]">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F9F8F5] border border-[#EDE9E1] rounded-xl text-[#0E0C0A] text-sm outline-none focus:border-gray-400 transition-all"
                >
                  <option value="">All</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[#8C8479]">Spender</label>
                <select
                  value={filterSpenderId}
                  onChange={(e) => setFilterSpenderId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F9F8F5] border border-[#EDE9E1] rounded-xl text-[#0E0C0A] text-sm outline-none focus:border-gray-400 transition-all"
                >
                  <option value="">All</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="px-5">
        {isLoading ? (
          <div className="flex justify-center py-24">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <EmptyState
            icon={<Receipt size={48} />}
            title={activeFilterCount > 0 ? 'No matching expenses' : 'No expenses yet'}
            description={
              activeFilterCount > 0
                ? 'Try adjusting your filters.'
                : isCurrentMonth
                ? 'Tap + to log your first expense.'
                : 'No expenses recorded for this month.'
            }
          />
        ) : (
          <div className="flex flex-col gap-2">
            {filteredTransactions.map((tx) => {
              const isOwner = tx.createdBy === user?.id
              return (
                <div
                  key={tx.id}
                  className="bg-white rounded-2xl border border-[#EDE9E1] shadow-[0_1px_3px_rgba(14,12,10,0.05)] px-4 py-3.5 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-money font-semibold text-[17px] text-gray-950">
                        {formatCurrency(tx.amount, currency)}
                      </span>
                      <Badge label={tx.category} colorKey={tx.category} />
                    </div>
                    {tx.description && (
                      <p className="text-sm text-gray-500 mt-0.5 truncate">{tx.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-gray-400">{formatDate(tx.date)}</p>
                      {tx.spenderName && (
                        <>
                          <span className="text-gray-200">·</span>
                          <p className="text-xs text-gray-400">
                            Paid by <span className="font-medium text-gray-500">{tx.spenderName}</span>
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  {isOwner && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(tx)}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(tx)}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-24 right-5 lg:bottom-8 w-14 h-14 bg-[#0E0C0A] text-white rounded-2xl shadow-lg hover:bg-[#2A2724] active:scale-95 transition-all duration-150 flex items-center justify-center z-30"
      >
        <Plus size={22} />
      </button>

      {/* Add transaction sheet */}
      <AddTransactionSheet
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        workspaceId={workspaceId!}
        currency={currency}
        onAdded={handleAdded}
      />

      {/* Edit modal */}
      <Modal
        isOpen={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title="Edit expense"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Amount"
            type="number"
            inputMode="decimal"
            value={editForm.amount?.toString() ?? ''}
            onChange={(e) =>
              setEditForm((f) => ({ ...f, amount: parseFloat(e.target.value) }))
            }
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-600 tracking-tight">
              Category
            </label>
            <select
              value={editForm.category ?? ''}
              onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-gray-950 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all duration-150"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Description"
            value={editForm.description ?? ''}
            onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
          />
          <Input
            label="Date"
            type="date"
            value={editForm.date ?? ''}
            onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
          />
          {members.length > 1 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-600 tracking-tight">Paid by</label>
              <select
                value={editForm.spenderId ?? ''}
                onChange={(e) => setEditForm((f) => ({ ...f, spenderId: e.target.value }))}
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
          <Button onClick={handleEdit} isLoading={editLoading} className="w-full" size="lg">
            Save changes
          </Button>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete expense"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-500 leading-relaxed">
            Remove this expense? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={deleteLoading}
              className="flex-1"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

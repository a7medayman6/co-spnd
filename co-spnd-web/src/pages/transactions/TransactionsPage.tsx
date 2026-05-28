import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Trash2, Pencil, Receipt, Download } from 'lucide-react'
import { transactionsService } from '../../services/transactions.service'
import { workspacesService } from '../../services/workspaces.service'
import { exportTransactionsToCsv } from '../../utils/csv'
import { useAuth } from '../../hooks/useAuth'
import type { Transaction, Workspace, UpdateTransactionDto } from '../../types'
import { CATEGORIES } from '../../types'
import { formatCurrency, formatDate, toInputDateValue } from '../../utils/date'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { AddTransactionSheet } from './AddTransactionSheet'

export function TransactionsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editTarget, setEditTarget] = useState<Transaction | null>(null)
  const [editForm, setEditForm] = useState<UpdateTransactionDto>({})
  const [editLoading, setEditLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const load = useCallback(async () => {
    if (!workspaceId) return
    const [txs, wsList] = await Promise.all([
      transactionsService.list(workspaceId),
      workspacesService.list(),
    ])
    setTransactions(txs)
    setWorkspace(wsList.find((w) => w.id === workspaceId) ?? null)
  }, [workspaceId])

  useEffect(() => {
    load().finally(() => setIsLoading(false))
  }, [load])

  function handleAdded(tx: Transaction) {
    setTransactions((prev) => [tx, ...prev])
  }

  function openEdit(tx: Transaction) {
    setEditTarget(tx)
    setEditForm({
      amount: tx.amount,
      category: tx.category,
      description: tx.description ?? '',
      date: toInputDateValue(tx.date),
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
    const today = new Date().toISOString().slice(0, 10)
    const safeName = (workspace?.name ?? 'workspace').replace(/\s+/g, '-')
    const filename = `co-spnd-${safeName}-${today}.csv`
    exportTransactionsToCsv(transactions, workspace?.currency ?? 'USD', filename)
  }

  const total = transactions.reduce((sum, t) => sum + t.amount, 0)
  const currency = workspace?.currency ?? 'USD'

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="px-5 pt-12 lg:pt-10 pb-5 flex items-start justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.12em] uppercase text-[#B5ADA4]">
            {workspace?.name ?? '···'}
          </p>
          <h1 className="text-[1.75rem] font-extrabold text-[#0E0C0A] mt-1 tracking-tight">
            Expenses
          </h1>
          {transactions.length > 0 && (
            <p className="mt-1 text-sm text-[#8C8479]">
              Total:{' '}
              <span className="font-money font-semibold text-[#0E0C0A]">
                {formatCurrency(total, currency)}
              </span>
            </p>
          )}
        </div>
        <button
          onClick={handleExport}
          disabled={transactions.length === 0}
          className="mt-4 p-1.5 text-[#B5ADA4] hover:text-[#8C8479] hover:bg-[#F2F0EB] rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Export CSV"
        >
          <Download size={18} />
        </button>
      </div>

      {/* List */}
      <div className="px-5">
        {isLoading ? (
          <div className="flex justify-center py-24">
            <LoadingSpinner size="lg" />
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={<Receipt size={48} />}
            title="No expenses yet"
            description="Tap + to log your first expense."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {transactions.map((tx) => {
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
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(tx.date)}</p>
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

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { UserPlus, Users, CheckCircle2, Wallet } from 'lucide-react'
import { workspacesService } from '../../services/workspaces.service'
import { analyticsService } from '../../services/analytics.service'
import { useAuth } from '../../hooks/useAuth'
import type { WorkspaceMember, SplitEntry, BalanceEntry, Analytics } from '../../types'
import { formatCurrency, getMonthRange } from '../../utils/date'
import { getBudget, setBudget, clearBudget } from '../../utils/budget'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

export function MembersPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { user } = useAuth()

  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [splitConfig, setSplitConfig] = useState<SplitEntry[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [currency, setCurrency] = useState('USD')
  const [isCreator, setIsCreator] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [showInvite, setShowInvite] = useState(false)
  const [email, setEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState(false)

  const [budget, setBudgetState] = useState<number | null>(null)
  const [showBudget, setShowBudget] = useState(false)
  const [budgetInput, setBudgetInput] = useState('')

  const load = useCallback(async () => {
    if (!workspaceId) return
    setIsError(false)
    const now = new Date()
    const { from, to } = getMonthRange(now)
    try {
      const [membersData, splitData, analyticsData, workspaces] = await Promise.all([
        workspacesService.getMembers(workspaceId),
        workspacesService.getSplittingConfig(workspaceId),
        analyticsService.get(workspaceId, from, to),
        workspacesService.list(),
      ])
      setMembers(membersData)
      setSplitConfig(splitData)
      setAnalytics(analyticsData)
      const workspace = workspaces.find((w) => w.id === workspaceId)
      setCurrency(workspace?.currency ?? 'USD')
      setIsCreator(workspace?.createdBy?.toString() === user?.id)
    } catch {
      setIsError(true)
    }
  }, [workspaceId, user?.id])

  useEffect(() => {
    load().finally(() => setIsLoading(false))
  }, [load])

  useEffect(() => {
    if (workspaceId) setBudgetState(getBudget(workspaceId))
  }, [workspaceId])

  function openBudgetModal() {
    setBudgetInput(budget !== null ? budget.toString() : '')
    setShowBudget(true)
  }

  function saveBudget() {
    if (!workspaceId) return
    const val = parseFloat(budgetInput)
    if (!budgetInput.trim() || isNaN(val) || val <= 0) {
      clearBudget(workspaceId)
      setBudgetState(null)
    } else {
      setBudget(workspaceId, val)
      setBudgetState(val)
    }
    setShowBudget(false)
  }

  function removeBudget() {
    if (!workspaceId) return
    clearBudget(workspaceId)
    setBudgetState(null)
    setShowBudget(false)
  }

  const total = analytics?.total ?? 0

  const balances: BalanceEntry[] = members.map((m) => {
    const split = splitConfig.find((s) => s.userId === m.id)
    const percentage = split?.percentage ?? 0
    const expectedShare = (total * percentage) / 100
    const actualSpend = analytics?.byUser.find((u) => u.userId === m.id)?.total ?? 0
    return {
      userId: m.id,
      name: m.name,
      percentage,
      expectedShare,
      actualSpend,
      balance: actualSpend - expectedShare,
    }
  })

  function startEditing() {
    const vals: Record<string, string> = {}
    members.forEach((m) => {
      const split = splitConfig.find((s) => s.userId === m.id)
      vals[m.id] = (split?.percentage ?? 0).toString()
    })
    setEditValues(vals)
    setSaveError('')
    setIsEditing(true)
  }

  function cancelEditing() {
    setIsEditing(false)
    setSaveError('')
  }

  const editSum = Object.values(editValues).reduce((acc, v) => acc + (parseFloat(v) || 0), 0)

  async function handleSave() {
    if (!workspaceId) return
    setSaving(true)
    setSaveError('')
    try {
      const entries = members.map((m) => ({
        userId: m.id,
        percentage: parseFloat(editValues[m.id] ?? '0') || 0,
      }))
      const updated = await workspacesService.updateSplittingConfig(workspaceId, entries)
      setSplitConfig(updated)
      setIsEditing(false)
    } catch (err: any) {
      setSaveError(err?.response?.data?.message ?? 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleInvite() {
    if (!email.trim() || !workspaceId) return
    setInviting(true)
    setInviteError('')
    try {
      await workspacesService.invite(workspaceId, email.trim())
      setInviteSuccess(true)
      const [membersData, splitData] = await Promise.all([
        workspacesService.getMembers(workspaceId),
        workspacesService.getSplittingConfig(workspaceId),
      ])
      setMembers(membersData)
      setSplitConfig(splitData)
    } catch {
      setInviteError('Could not invite this user. Check the email and try again.')
    } finally {
      setInviting(false)
    }
  }

  function handleCloseInvite() {
    setShowInvite(false)
    setEmail('')
    setInviteError('')
    setInviteSuccess(false)
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="px-5 pt-12 lg:pt-10 pb-5 flex items-start justify-between">
        <div>
          <h1 className="text-[1.75rem] font-extrabold text-[#0E0C0A] tracking-tight">
            Members
          </h1>
          <p className="text-sm text-[#8C8479] mt-1">
            {members.length} member{members.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2">
          {isCreator && !isEditing && members.length > 0 && (
            <Button onClick={startEditing} variant="secondary" size="sm">
              Edit splits
            </Button>
          )}
          <Button
            onClick={() => setShowInvite(true)}
            variant="secondary"
            size="sm"
            className="flex items-center gap-1.5"
          >
            <UserPlus size={14} />
            Invite
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="px-5">
        {isLoading ? (
          <div className="flex justify-center py-24">
            <LoadingSpinner size="lg" />
          </div>
        ) : isError ? (
          <p className="text-center text-sm text-gray-400 py-24">
            Could not load members. Try refreshing the page.
          </p>
        ) : members.length === 0 ? (
          <EmptyState
            icon={<Users size={48} />}
            title="No members yet"
            description="Invite your friends to this workspace."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {members.map((m) => {
              const split = splitConfig.find((s) => s.userId === m.id)
              return (
                <div
                  key={m.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] px-4 py-3.5 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-gray-500">
                      {m.name?.[0]?.toUpperCase() ?? '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-950 text-[15px]">{m.name}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{m.email}</p>
                  </div>
                  {isEditing ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={editValues[m.id] ?? '0'}
                        onChange={(e) =>
                          setEditValues((v) => ({ ...v, [m.id]: e.target.value }))
                        }
                        className="w-16 px-2 py-1.5 text-sm text-right border border-gray-200 rounded-xl outline-none focus:border-gray-400 transition-colors"
                      />
                      <span className="text-sm text-gray-400">%</span>
                    </div>
                  ) : (
                    split !== undefined && (
                      <span className="text-sm font-semibold text-gray-500 shrink-0">
                        {split.percentage}%
                      </span>
                    )
                  )}
                </div>
              )
            })}

            {/* Edit mode controls */}
            {isEditing && (
              <div className="mt-1 pb-2">
                <p
                  className={`text-center text-sm font-semibold mb-3 ${
                    Math.abs(editSum - 100) < 0.01 ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  Total: {editSum.toFixed(editSum % 1 === 0 ? 0 : 1)}%
                </p>
                {saveError && (
                  <p className="text-sm text-red-500 font-medium bg-red-50 px-4 py-2.5 rounded-xl mb-3">
                    {saveError}
                  </p>
                )}
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={cancelEditing} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    isLoading={saving}
                    disabled={Math.abs(editSum - 100) > 0.01}
                    className="flex-1"
                  >
                    Save
                  </Button>
                </div>
              </div>
            )}

            {/* Balance section */}
            {!isEditing && total > 0 && (
              <div className="mt-4">
                <p className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400 mb-3">
                  Balance this month
                </p>
                <div className="flex flex-col gap-2">
                  {balances.map((b) => (
                    <div
                      key={b.userId}
                      className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] px-4 py-3.5 flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-gray-500">
                          {b.name?.[0]?.toUpperCase() ?? '?'}
                        </span>
                      </div>
                      <span className="flex-1 font-semibold text-gray-950 text-[15px]">
                        {b.name}
                      </span>
                      <span
                        className={`font-money text-sm font-semibold shrink-0 ${
                          b.balance >= 0 ? 'text-emerald-600' : 'text-red-500'
                        }`}
                      >
                        {b.balance >= 0 ? '+' : ''}
                        {formatCurrency(b.balance, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Budget section */}
      <div className="px-5 mt-6 mb-6">
        <p className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400 mb-3">
          Settings
        </p>
        <button
          onClick={openBudgetModal}
          className="w-full bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] px-4 py-3.5 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-[#F3F0FF] flex items-center justify-center shrink-0">
            <Wallet size={18} className="text-[#863bff]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-950 text-[15px]">Monthly budget</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {budget !== null ? formatCurrency(budget, currency) : 'Not set'}
            </p>
          </div>
          <span className="text-xs font-medium text-[#863bff] shrink-0">
            {budget !== null ? 'Edit' : 'Set'}
          </span>
        </button>
      </div>

      {/* Budget modal */}
      <Modal isOpen={showBudget} onClose={() => setShowBudget(false)} title="Monthly budget">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-500 leading-relaxed">
            Set a monthly spending target for this workspace. The progress bar on the expenses
            page will show how close you are.
          </p>
          <Input
            label="Budget amount"
            type="number"
            inputMode="decimal"
            placeholder="e.g. 2000"
            value={budgetInput}
            onChange={(e) => setBudgetInput(e.target.value)}
            autoFocus
          />
          <Button onClick={saveBudget} className="w-full" size="lg">
            Save budget
          </Button>
          {budget !== null && (
            <button
              onClick={removeBudget}
              className="text-sm text-red-500 font-medium text-center py-1 hover:text-red-600 transition-colors"
            >
              Remove budget
            </button>
          )}
        </div>
      </Modal>

      {/* Invite modal */}
      <Modal isOpen={showInvite} onClose={handleCloseInvite} title="Invite member">
        <div className="flex flex-col gap-4">
          {inviteSuccess ? (
            <div className="flex flex-col items-center py-4 gap-3">
              <CheckCircle2 size={40} className="text-emerald-500" />
              <p className="text-[15px] font-semibold text-gray-950">Invitation sent!</p>
              <p className="text-sm text-gray-400 text-center">
                They'll appear here once they join.
              </p>
              <Button onClick={handleCloseInvite} className="w-full mt-2">
                Done
              </Button>
            </div>
          ) : (
            <>
              <Input
                label="Email address"
                type="email"
                placeholder="friend@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
              {inviteError && (
                <p className="text-sm text-red-500 font-medium bg-red-50 px-4 py-2.5 rounded-xl">
                  {inviteError}
                </p>
              )}
              <Button
                onClick={handleInvite}
                isLoading={inviting}
                className="w-full"
                size="lg"
              >
                Send invite
              </Button>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}

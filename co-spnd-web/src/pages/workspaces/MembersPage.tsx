import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { UserPlus, Users, CheckCircle2, Wallet, Pencil, Check, X, Plus } from 'lucide-react'
import { workspacesService } from '../../services/workspaces.service'
import { analyticsService } from '../../services/analytics.service'
import { useAuth } from '../../hooks/useAuth'
import { cacheGet, cacheSet, cacheInvalidate } from '../../utils/cache'
import type { WorkspaceMember, SplitEntry, BalanceEntry, Analytics, Workspace } from '../../types'
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

  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [splitConfig, setSplitConfig] = useState<SplitEntry[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [currency, setCurrency] = useState('USD')
  const [isCreator, setIsCreator] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  // Workspace name editing
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameError, setNameError] = useState('')

  // Split editing
  const [isEditing, setIsEditing] = useState(false)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Invite modal
  const [showInvite, setShowInvite] = useState(false)
  const [email, setEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState(false)

  // Budget
  const [budget, setBudgetState] = useState<number | null>(null)
  const [showBudget, setShowBudget] = useState(false)
  const [budgetInput, setBudgetInput] = useState('')

  // Categories
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [newCategoryInput, setNewCategoryInput] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)
  const [categoryLoading, setCategoryLoading] = useState(false)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setIsError(false)
    const now = new Date()
    const { from, to } = getMonthRange(now)
    try {
      const [membersData, splitData, analyticsData, workspaces, categoriesData] = await Promise.all([
        workspacesService.getMembers(workspaceId),
        workspacesService.getSplittingConfig(workspaceId),
        analyticsService.get(workspaceId, from, to),
        workspacesService.list(),
        workspacesService.getCategories(workspaceId),
      ])
      cacheSet(`workspace:${workspaceId}:members`, membersData)
      cacheSet('workspaces', workspaces)
      cacheSet(`workspace:${workspaceId}:categories`, categoriesData)
      cacheSet(`workspace:${workspaceId}:analytics:${from}:${to}`, analyticsData)
      setMembers(membersData)
      setSplitConfig(splitData)
      setAnalytics(analyticsData)
      const ws = workspaces.find((w) => w.id === workspaceId) ?? null
      setWorkspace(ws)
      setCurrency(ws?.currency ?? 'USD')
      setIsCreator(ws?.createdBy?.toString() === user?.id)
      setCustomCategories(categoriesData)
    } catch {
      setIsError(true)
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId, user?.id])

  useEffect(() => {
    if (!workspaceId) return
    const now = new Date()
    const { from, to } = getMonthRange(now)
    const cachedMembers = cacheGet<WorkspaceMember[]>(`workspace:${workspaceId}:members`)
    const cachedWs = cacheGet<Workspace[]>('workspaces')
    if (cachedMembers && cachedWs) {
      const ws = cachedWs.find((w) => w.id === workspaceId) ?? null
      setMembers(cachedMembers)
      setWorkspace(ws)
      setCurrency(ws?.currency ?? 'USD')
      setIsCreator(ws?.createdBy?.toString() === user?.id)
      const cachedAnalytics = cacheGet<Analytics>(`workspace:${workspaceId}:analytics:${from}:${to}`)
      const cachedCats = cacheGet<string[]>(`workspace:${workspaceId}:categories`)
      if (cachedAnalytics) setAnalytics(cachedAnalytics)
      if (cachedCats) setCustomCategories(cachedCats)
      setIsLoading(false)
    }
    load()
  }, [load, workspaceId, user?.id])

  useEffect(() => {
    if (workspaceId) setBudgetState(getBudget(workspaceId))
  }, [workspaceId])

  // ── Workspace name ──────────────────────────────────────────
  function openEditName() {
    setNameInput(workspace?.name ?? '')
    setNameError('')
    setEditingName(true)
  }

  async function saveWorkspaceName() {
    if (!workspaceId || !nameInput.trim()) return
    setNameSaving(true)
    setNameError('')
    try {
      const updated = await workspacesService.updateName(workspaceId, nameInput.trim())
      setWorkspace((w) => {
        const next = w ? { ...w, name: updated.name } : w
        if (next) cacheInvalidate('workspaces')
        return next
      })
      setEditingName(false)
    } catch {
      setNameError('Failed to save. Try again.')
    } finally {
      setNameSaving(false)
    }
  }

  // ── Budget ──────────────────────────────────────────────────
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

  // ── Splits ──────────────────────────────────────────────────
  const total = analytics?.total ?? 0

  const balances: BalanceEntry[] = members.map((m) => {
    const split = splitConfig.find((s) => s.userId === m.id)
    const percentage = split?.percentage ?? 0
    const expectedShare = (total * percentage) / 100
    const actualSpend = analytics?.byUser.find((u) => u.userId === m.id)?.total ?? 0
    return { userId: m.id, name: m.name, percentage, expectedShare, actualSpend, balance: actualSpend - expectedShare }
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

  function cancelEditing() { setIsEditing(false); setSaveError('') }

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

  // ── Invite ──────────────────────────────────────────────────
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
      cacheSet(`workspace:${workspaceId}:members`, membersData)
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

  async function handleAddCategory() {
    const trimmed = newCategoryInput.trim()
    if (!trimmed || !workspaceId) return
    setCategoryLoading(true)
    try {
      const updated = await workspacesService.updateCategories(workspaceId, [trimmed], [])
      cacheSet(`workspace:${workspaceId}:categories`, updated)
      setCustomCategories(updated)
      setNewCategoryInput('')
      setAddingCategory(false)
    } catch {
      // keep input open, user can retry
    } finally {
      setCategoryLoading(false)
    }
  }

  async function handleRemoveCategory(cat: string) {
    if (!workspaceId) return
    try {
      const updated = await workspacesService.updateCategories(workspaceId, [], [cat])
      cacheSet(`workspace:${workspaceId}:categories`, updated)
      setCustomCategories(updated)
    } catch {
      // silently ignore
    }
  }

  return (
    <div className="min-h-screen bg-surface pb-8">
      {/* Header */}
      <div className="px-5 pt-5 lg:pt-10 pb-5 flex items-start justify-between">
        <div>
          <h1 className="text-[1.75rem] font-extrabold text-[#0E0C0A] tracking-tight">Settings</h1>
          <p className="text-sm text-[#8C8479] mt-1">{workspace?.name ?? '···'}</p>
        </div>
        <Button
          onClick={() => setShowInvite(true)}
          variant="secondary"
          size="sm"
          className="flex items-center gap-1.5 mt-2"
        >
          <UserPlus size={14} />
          Invite
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>
      ) : isError ? (
        <p className="text-center text-sm text-gray-400 py-24">Could not load settings. Try refreshing.</p>
      ) : (
        <div className="px-5 flex flex-col gap-6">

          {/* ── Workspace ───────────────────────────────────── */}
          <section>
            <p className="text-xs font-bold tracking-[0.12em] uppercase text-[#B5ADA4] mb-3">Workspace</p>
            <div className="bg-white rounded-2xl border border-[#EDE9E1] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
              {/* Name row */}
              <div className="px-4 py-3.5 flex items-center gap-3 border-b border-[#F2F0EB]">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#B5ADA4] font-medium mb-0.5">Name</p>
                  {editingName ? (
                    <input
                      autoFocus
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveWorkspaceName(); if (e.key === 'Escape') setEditingName(false) }}
                      className="w-full text-[15px] font-semibold text-[#0E0C0A] bg-transparent outline-none border-b-2 border-[#0E0C0A] pb-0.5"
                    />
                  ) : (
                    <p className="text-[15px] font-semibold text-[#0E0C0A] truncate">{workspace?.name}</p>
                  )}
                  {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
                </div>
                {isCreator && (
                  editingName ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={saveWorkspaceName}
                        disabled={nameSaving || !nameInput.trim()}
                        className="w-8 h-8 flex items-center justify-center text-emerald-500 hover:bg-emerald-50 rounded-xl transition-colors disabled:opacity-40"
                      >
                        {nameSaving ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Check size={15} />}
                      </button>
                      <button
                        onClick={() => setEditingName(false)}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={openEditName}
                      className="w-8 h-8 flex items-center justify-center text-[#B5ADA4] hover:text-[#8C8479] hover:bg-[#F2F0EB] rounded-xl transition-colors shrink-0"
                    >
                      <Pencil size={14} />
                    </button>
                  )
                )}
              </div>
              {/* Currency row (read-only) */}
              <div className="px-4 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#B5ADA4] font-medium mb-0.5">Currency</p>
                  <p className="text-[15px] font-semibold text-[#0E0C0A]">{workspace?.currency}</p>
                </div>
                <span className="text-xs text-[#B5ADA4] font-medium">Immutable</span>
              </div>
            </div>
          </section>

          {/* ── Members ─────────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold tracking-[0.12em] uppercase text-[#B5ADA4]">
                Members · {members.length}
              </p>
              {isCreator && !isEditing && members.length > 0 && (
                <button onClick={startEditing} className="text-xs font-semibold text-[#8C8479] hover:text-[#0E0C0A] transition-colors">
                  Edit splits
                </button>
              )}
            </div>

            {members.length === 0 ? (
              <EmptyState icon={<Users size={48} />} title="No members yet" description="Invite your friends to this workspace." />
            ) : (
              <div className="flex flex-col gap-2">
                {members.map((m) => {
                  const split = splitConfig.find((s) => s.userId === m.id)
                  return (
                    <div
                      key={m.id}
                      className="bg-white rounded-2xl border border-[#EDE9E1] shadow-[0_1px_4px_rgba(0,0,0,0.06)] px-4 py-3.5 flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#F2F0EB] flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-[#8C8479]">
                          {m.name?.[0]?.toUpperCase() ?? '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#0E0C0A] text-[15px]">
                          {m.name}{m.id === user?.id ? ' (you)' : ''}
                        </p>
                        <p className="text-xs text-[#B5ADA4] truncate mt-0.5">{m.email}</p>
                      </div>
                      {isEditing ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={editValues[m.id] ?? '0'}
                            onChange={(e) => setEditValues((v) => ({ ...v, [m.id]: e.target.value }))}
                            className="w-16 px-2 py-1.5 text-sm text-right border border-[#EDE9E1] rounded-xl outline-none focus:border-gray-400 transition-colors"
                          />
                          <span className="text-sm text-[#B5ADA4]">%</span>
                        </div>
                      ) : (
                        split !== undefined && (
                          <span className="text-sm font-semibold text-[#8C8479] shrink-0">{split.percentage}%</span>
                        )
                      )}
                    </div>
                  )
                })}

                {isEditing && (
                  <div className="mt-1 pb-2">
                    <p className={`text-center text-sm font-semibold mb-3 ${Math.abs(editSum - 100) < 0.01 ? 'text-emerald-600' : 'text-red-500'}`}>
                      Total: {editSum.toFixed(editSum % 1 === 0 ? 0 : 1)}%
                    </p>
                    {saveError && (
                      <p className="text-sm text-red-500 font-medium bg-red-50 px-4 py-2.5 rounded-xl mb-3">{saveError}</p>
                    )}
                    <div className="flex gap-3">
                      <Button variant="secondary" onClick={cancelEditing} className="flex-1">Cancel</Button>
                      <Button onClick={handleSave} isLoading={saving} disabled={Math.abs(editSum - 100) > 0.01} className="flex-1">Save</Button>
                    </div>
                  </div>
                )}

                {!isEditing && total > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-bold tracking-[0.12em] uppercase text-[#B5ADA4] mb-3">Balance this month</p>
                    <div className="flex flex-col gap-2">
                      {balances.map((b) => (
                        <div
                          key={b.userId}
                          className="bg-white rounded-2xl border border-[#EDE9E1] shadow-[0_1px_4px_rgba(0,0,0,0.06)] px-4 py-3.5 flex items-center gap-3"
                        >
                          <div className="w-10 h-10 rounded-full bg-[#F2F0EB] flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-[#8C8479]">{b.name?.[0]?.toUpperCase() ?? '?'}</span>
                          </div>
                          <span className="flex-1 font-semibold text-[#0E0C0A] text-[15px]">{b.name}</span>
                          <span className={`font-money text-sm font-semibold shrink-0 ${b.balance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {b.balance >= 0 ? '+' : ''}{formatCurrency(b.balance, currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ── Budget ──────────────────────────────────────── */}
          <section>
            <p className="text-xs font-bold tracking-[0.12em] uppercase text-[#B5ADA4] mb-3">Budget</p>
            <button
              onClick={openBudgetModal}
              className="w-full bg-white rounded-2xl border border-[#EDE9E1] shadow-[0_1px_4px_rgba(0,0,0,0.06)] px-4 py-3.5 flex items-center gap-3 text-left hover:bg-[#F9F8F5] transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-[#F3F0FF] flex items-center justify-center shrink-0">
                <Wallet size={18} className="text-[#863bff]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#0E0C0A] text-[15px]">Monthly budget</p>
                <p className="text-xs text-[#B5ADA4] mt-0.5">
                  {budget !== null ? formatCurrency(budget, currency) : 'Not set'}
                </p>
              </div>
              <span className="text-xs font-semibold text-[#863bff] shrink-0">
                {budget !== null ? 'Edit' : 'Set'}
              </span>
            </button>
          </section>

          {/* ── Categories ──────────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold tracking-[0.12em] uppercase text-[#B5ADA4]">Custom Categories</p>
              {!addingCategory && (
                <button
                  onClick={() => setAddingCategory(true)}
                  className="text-xs font-semibold text-[#8C8479] hover:text-[#0E0C0A] transition-colors flex items-center gap-1"
                >
                  <Plus size={12} />
                  Add
                </button>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-[#EDE9E1] shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
              {customCategories.length === 0 && !addingCategory ? (
                <div className="px-4 py-4 text-sm text-[#B5ADA4] text-center">No custom categories yet</div>
              ) : (
                <div className="divide-y divide-[#F2F0EB]">
                  {customCategories.map((cat) => (
                    <div key={cat} className="px-4 py-3 flex items-center justify-between">
                      <span className="text-[15px] font-medium text-[#0E0C0A]">{cat}</span>
                      <button
                        onClick={() => handleRemoveCategory(cat)}
                        className="w-7 h-7 flex items-center justify-center text-[#B5ADA4] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {addingCategory && (
                <div className="px-4 py-3 border-t border-[#F2F0EB] flex items-center gap-2">
                  <input
                    autoFocus
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddCategory()
                      if (e.key === 'Escape') { setAddingCategory(false); setNewCategoryInput('') }
                    }}
                    placeholder="e.g. Groceries"
                    className="flex-1 text-sm text-[#0E0C0A] bg-transparent outline-none"
                  />
                  <button
                    onClick={handleAddCategory}
                    disabled={!newCategoryInput.trim() || categoryLoading}
                    className="w-7 h-7 flex items-center justify-center bg-[#0E0C0A] text-white rounded-lg disabled:opacity-40 transition-colors"
                  >
                    {categoryLoading ? (
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check size={12} />
                    )}
                  </button>
                  <button
                    onClick={() => { setAddingCategory(false); setNewCategoryInput('') }}
                    className="w-7 h-7 flex items-center justify-center text-[#B5ADA4] hover:text-[#8C8479] rounded-lg transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}
            </div>
          </section>

        </div>
      )}

      {/* Budget modal */}
      <Modal isOpen={showBudget} onClose={() => setShowBudget(false)} title="Monthly budget">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-500 leading-relaxed">
            Set a monthly spending target for this workspace. The progress bar on the expenses page will show how close you are.
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
          <Button onClick={saveBudget} className="w-full" size="lg">Save budget</Button>
          {budget !== null && (
            <button onClick={removeBudget} className="text-sm text-red-500 font-medium text-center py-1 hover:text-red-600 transition-colors">
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
              <p className="text-sm text-gray-400 text-center">They'll appear here once they join.</p>
              <Button onClick={handleCloseInvite} className="w-full mt-2">Done</Button>
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
                <p className="text-sm text-red-500 font-medium bg-red-50 px-4 py-2.5 rounded-xl">{inviteError}</p>
              )}
              <Button onClick={handleInvite} isLoading={inviting} className="w-full" size="lg">
                Send invite
              </Button>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}

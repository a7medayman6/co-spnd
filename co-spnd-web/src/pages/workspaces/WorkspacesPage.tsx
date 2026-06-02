import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, Plus, Users, LogOut, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { workspacesService } from '../../services/workspaces.service'
import { analyticsService } from '../../services/analytics.service'
import { useAuth } from '../../hooks/useAuth'
import { cacheGet, cacheSet, cacheInvalidate } from '../../utils/cache'
import type { UserAnalytics, Workspace } from '../../types'
import { formatCurrency, getMonthLabel, getMonthRange } from '../../utils/date'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { Logo } from '../../components/ui/Logo'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'EGP', 'SAR', 'CAD', 'AUD']

interface PersonalAnalyticsProps {
  analytics: UserAnalytics
  monthLabel: string
  monthOffset: number
  onPreviousMonth: () => void
  onNextMonth: () => void
}

function PersonalAnalytics({
  analytics,
  monthLabel,
  monthOffset,
  onPreviousMonth,
  onNextMonth,
}: PersonalAnalyticsProps) {
  const hasSpend = analytics.totalsByCurrency.some((item) => item.total > 0)
  const topCategories = analytics.byCategory.filter((item) => item.total > 0).slice(0, 4)
  const activeWorkspaces = analytics.byWorkspace.filter(
    (workspace) => workspace.userTotal > 0 || workspace.workspaceTotal > 0,
  )

  return (
    <section className="mt-7 pb-8 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.12em] uppercase text-[#B5ADA4]">
            Your analytics
          </p>
          <h2 className="text-lg font-extrabold text-[#0E0C0A] tracking-tight">
            {monthLabel}
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onPreviousMonth}
            className="w-9 h-9 rounded-2xl bg-white border border-[#EDE9E1] flex items-center justify-center text-[#8C8479] hover:text-[#0E0C0A] hover:bg-[#F9F8F5] transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={17} />
          </button>
          <button
            onClick={onNextMonth}
            disabled={monthOffset >= 0}
            className="w-9 h-9 rounded-2xl bg-white border border-[#EDE9E1] flex items-center justify-center text-[#8C8479] hover:text-[#0E0C0A] hover:bg-[#F9F8F5] transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
            aria-label="Next month"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      {!hasSpend && activeWorkspaces.length === 0 && (
        <div className="bg-white border border-[#EDE9E1] rounded-2xl px-4 py-6 shadow-[0_1px_3px_rgba(14,12,10,0.04)] text-center">
          <div className="w-10 h-10 mx-auto rounded-2xl bg-[#F9F8F5] border border-[#EDE9E1] flex items-center justify-center text-[#B5ADA4] mb-3">
            <BarChart3 size={18} />
          </div>
          <p className="text-sm font-semibold text-[#0E0C0A]">No spending this month</p>
          <p className="text-xs text-[#8C8479] mt-1">
            Add expenses or switch months to see your activity.
          </p>
        </div>
      )}

      {hasSpend && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {analytics.totalsByCurrency.map((item) => (
            <div
              key={item.currency}
              className="bg-white border border-[#EDE9E1] rounded-2xl px-4 py-3 shadow-[0_1px_3px_rgba(14,12,10,0.04)]"
            >
              <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-[#B5ADA4] mb-1">
                {item.currency}
              </p>
              <p className="font-money text-2xl font-semibold text-[#0E0C0A] leading-none">
                {formatCurrency(item.total, item.currency)}
              </p>
              <p className="text-xs text-[#8C8479] mt-2">
                {item.transactionCount} transaction{item.transactionCount === 1 ? '' : 's'}
              </p>
            </div>
          ))}
        </div>
      )}

      {topCategories.length > 0 && (
        <div className="bg-white border border-[#EDE9E1] rounded-2xl px-4 py-4 shadow-[0_1px_3px_rgba(14,12,10,0.04)]">
          <p className="text-xs font-bold tracking-[0.12em] uppercase text-[#B5ADA4] mb-3">
            Top categories
          </p>
          <div className="flex flex-col gap-3">
            {topCategories.map((category) => (
              <div
                key={`${category.category}-${category.currency}`}
                className="flex items-center justify-between gap-3"
              >
                <span className="text-sm font-semibold text-[#0E0C0A] truncate">
                  {category.category}
                </span>
                <span className="font-money text-sm font-semibold text-[#0E0C0A] shrink-0">
                  {formatCurrency(category.total, category.currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeWorkspaces.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {activeWorkspaces.map((workspace) => {
            const share =
              workspace.workspaceTotal > 0
                ? Math.min((workspace.userTotal / workspace.workspaceTotal) * 100, 100)
                : 0
            const categories = workspace.byCategory.slice(0, 3)

            return (
              <div
                key={workspace.workspaceId}
                className="bg-white border border-[#EDE9E1] rounded-2xl px-4 py-4 shadow-[0_1px_3px_rgba(14,12,10,0.04)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold text-[#0E0C0A] truncate">
                      {workspace.name}
                    </p>
                    <p className="text-xs text-[#8C8479] mt-1">
                      Your spend · {workspace.userTransactionCount} transaction
                      {workspace.userTransactionCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#8C8479] bg-[#F2F0EB] px-2 py-1 rounded-lg shrink-0">
                    {workspace.currency}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <p className="text-[11px] text-[#B5ADA4] font-semibold mb-1">You</p>
                    <p className="font-money text-[17px] font-semibold text-[#0E0C0A]">
                      {formatCurrency(workspace.userTotal, workspace.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#B5ADA4] font-semibold mb-1">Workspace</p>
                    <p className="font-money text-[17px] font-semibold text-[#0E0C0A]">
                      {formatCurrency(workspace.workspaceTotal, workspace.currency)}
                    </p>
                  </div>
                </div>

                <div className="h-1.5 bg-[#F2F0EB] rounded-full overflow-hidden mt-3">
                  <div
                    className="h-full bg-[#0E0C0A] rounded-full transition-all duration-700"
                    style={{ width: `${share}%` }}
                  />
                </div>

                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {categories.map((category) => (
                      <span
                        key={category.category}
                        className="text-[11px] font-semibold text-[#8C8479] bg-[#F9F8F5] border border-[#EDE9E1] px-2 py-1 rounded-lg"
                      >
                        {category.category} · {formatCurrency(category.total, workspace.currency)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export function WorkspacesPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [monthOffset, setMonthOffset] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [leaveTarget, setLeaveTarget] = useState<Workspace | null>(null)
  const [leaving, setLeaving] = useState(false)
  const [leaveError, setLeaveError] = useState('')

  const currentDate = new Date()
  currentDate.setMonth(currentDate.getMonth() + monthOffset)
  const { from, to } = getMonthRange(currentDate)
  const monthLabel = getMonthLabel(currentDate)

  useEffect(() => {
    const cached = cacheGet<Workspace[]>('workspaces')
    if (cached) { setWorkspaces(cached); setIsLoading(false) }
    workspacesService.list()
      .then(ws => { setWorkspaces(ws); cacheSet('workspaces', ws) })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    const key = `analytics:me:${from}:${to}`
    const cached = cacheGet<UserAnalytics>(key)
    if (cached) setAnalytics(cached)
    analyticsService.getMine(from, to)
      .then(a => { setAnalytics(a); cacheSet(key, a) })
      .catch(() => {})
  }, [from, to])

  async function handleCreate() {
    if (!name.trim()) return
    setCreating(true)
    setCreateError('')
    try {
      const ws = await workspacesService.create(name.trim(), currency)
      setWorkspaces((prev) => {
        const next = [ws, ...prev]
        cacheSet('workspaces', next)
        return next
      })
      setShowCreate(false)
      setName('')
      setCurrency('USD')
      navigate(`/workspaces/${ws.id}/transactions`)
    } catch {
      setCreateError('Failed to create workspace.')
    } finally {
      setCreating(false)
    }
  }

  function handleCloseCreate() {
    setShowCreate(false)
    setName('')
    setCurrency('USD')
    setCreateError('')
  }

  async function handleLeave() {
    if (!leaveTarget) return
    setLeaving(true)
    setLeaveError('')
    try {
      await workspacesService.leave(leaveTarget.id)
      setWorkspaces((prev) => {
        const next = prev.filter((w) => w.id !== leaveTarget.id)
        cacheSet('workspaces', next)
        return next
      })
      cacheInvalidate('analytics:me:')
      setLeaveTarget(null)
    } catch {
      setLeaveError('Something went wrong. Please try again.')
    } finally {
      setLeaving(false)
    }
  }

  const firstName = user?.name?.split(' ')[0] ?? 'there'

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-lg mx-auto lg:max-w-xl px-5">
        {/* Header */}
        <div className="pt-14 lg:pt-12 pb-8 flex items-start justify-between">
          <div>
            <Logo size="sm" className="mb-5 text-[#0E0C0A]" />
            <h1 className="text-[1.75rem] font-extrabold text-[#0E0C0A] tracking-tight leading-tight">
              Hey, {firstName}
            </h1>
            <p className="text-[#8C8479] text-sm mt-1">
              {workspaces.length > 0
                ? `${workspaces.length} workspace${workspaces.length !== 1 ? 's' : ''}`
                : 'Your workspaces'}
            </p>
          </div>
          <button
            onClick={logout}
            className="p-2 -mr-1 text-[#B5ADA4] hover:text-[#8C8479] hover:bg-[#F2F0EB] rounded-xl transition-colors"
            aria-label="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-24">
            <LoadingSpinner size="lg" />
          </div>
        ) : workspaces.length === 0 ? (
          <EmptyState
            icon={<Users size={48} />}
            title="No workspaces yet"
            description="Create your first workspace to start tracking shared expenses."
            action={
              <Button onClick={() => setShowCreate(true)} size="lg">
                <Plus size={16} />
                New workspace
              </Button>
            }
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold tracking-[0.12em] uppercase text-[#B5ADA4]">
                Workspaces
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pb-8">
              {workspaces.map((ws) => (
                <div
                  key={ws.id}
                  className="w-full bg-white rounded-2xl border border-[#EDE9E1] shadow-[0_1px_3px_rgba(14,12,10,0.05)] flex items-center overflow-hidden hover:shadow-md hover:border-[#D9D3C8] transition-all duration-150"
                >
                  <button
                    onClick={() => navigate(`/workspaces/${ws.id}/transactions`)}
                    className="flex-1 px-4 py-4 flex items-center justify-between text-left active:scale-[0.99] transition-transform duration-150 min-w-0"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-[#0E0C0A] text-[15px] truncate">{ws.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-[#8C8479]">
                          {ws.membersCount ?? 1} member{(ws.membersCount ?? 1) !== 1 ? 's' : ''}
                        </span>
                        <span className="text-[#D9D3C8]">·</span>
                        <span className="text-xs font-semibold text-[#8C8479] bg-[#F2F0EB] px-1.5 py-0.5 rounded-md">
                          {ws.currency}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-[#C8C2B9] shrink-0 ml-3" />
                  </button>
                  <button
                    onClick={() => { setLeaveTarget(ws); setLeaveError('') }}
                    className="px-3 py-4 text-[#C8C2B9] hover:text-red-400 hover:bg-red-50 transition-colors border-l border-[#EDE9E1] self-stretch flex items-center"
                    aria-label={`Leave ${ws.name}`}
                  >
                    {(ws.membersCount ?? 1) <= 1 ? <Trash2 size={15} /> : <LogOut size={15} />}
                  </button>
                </div>
              ))}
            </div>

            {analytics && (
              <PersonalAnalytics
                analytics={analytics}
                monthLabel={monthLabel}
                monthOffset={monthOffset}
                onPreviousMonth={() => setMonthOffset((offset) => offset - 1)}
                onNextMonth={() => setMonthOffset((offset) => offset + 1)}
              />
            )}
          </>
        )}
      </div>

      {/* FAB */}
      {workspaces.length > 0 && (
        <button
          onClick={() => setShowCreate(true)}
          className="fixed bottom-8 right-5 w-14 h-14 bg-[#0E0C0A] text-white rounded-2xl shadow-lg hover:bg-[#2A2724] active:scale-95 transition-all duration-150 flex items-center justify-center z-30"
        >
          <Plus size={22} />
        </button>
      )}

      {/* Leave / delete workspace confirmation */}
      <Modal
        isOpen={Boolean(leaveTarget)}
        onClose={() => { setLeaveTarget(null); setLeaveError('') }}
        title={(leaveTarget?.membersCount ?? 1) <= 1 ? 'Delete workspace?' : 'Leave workspace?'}
      >
        <div className="flex flex-col gap-4">
          {(leaveTarget?.membersCount ?? 1) <= 1 ? (
            <p className="text-sm text-[#8C8479] leading-relaxed">
              You're the only member of{' '}
              <span className="font-semibold text-[#0E0C0A]">{leaveTarget?.name}</span>. Leaving will
              permanently delete the workspace and all its transactions. This cannot be undone.
            </p>
          ) : (
            <p className="text-sm text-[#8C8479] leading-relaxed">
              You'll be removed from{' '}
              <span className="font-semibold text-[#0E0C0A]">{leaveTarget?.name}</span>. Other members
              and their data will remain.
            </p>
          )}
          {leaveError && (
            <p className="text-sm text-red-500 font-medium bg-red-50 px-4 py-2.5 rounded-xl">
              {leaveError}
            </p>
          )}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => { setLeaveTarget(null); setLeaveError('') }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleLeave}
              isLoading={leaving}
              className="flex-1"
            >
              {(leaveTarget?.membersCount ?? 1) <= 1 ? 'Delete workspace' : 'Leave workspace'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create workspace modal */}
      <Modal isOpen={showCreate} onClose={handleCloseCreate} title="New workspace">
        <div className="flex flex-col gap-4">
          <Input
            label="Workspace name"
            placeholder="e.g. Trip to Dubai"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-600 tracking-tight">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-gray-950 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all duration-150"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          {createError && (
            <p className="text-sm text-red-500 font-medium">{createError}</p>
          )}
          <Button onClick={handleCreate} isLoading={creating} className="w-full" size="lg">
            Create workspace
          </Button>
        </div>
      </Modal>
    </div>
  )
}

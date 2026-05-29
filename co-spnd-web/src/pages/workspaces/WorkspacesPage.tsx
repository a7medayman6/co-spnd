import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, LogOut, ChevronRight, Trash2 } from 'lucide-react'
import { workspacesService } from '../../services/workspaces.service'
import { useAuth } from '../../hooks/useAuth'
import type { Workspace } from '../../types'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { Logo } from '../../components/ui/Logo'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'EGP', 'SAR', 'CAD', 'AUD']

export function WorkspacesPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [leaveTarget, setLeaveTarget] = useState<Workspace | null>(null)
  const [leaving, setLeaving] = useState(false)
  const [leaveError, setLeaveError] = useState('')

  useEffect(() => {
    workspacesService
      .list()
      .then(setWorkspaces)
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  async function handleCreate() {
    if (!name.trim()) return
    setCreating(true)
    setCreateError('')
    try {
      const ws = await workspacesService.create(name.trim(), currency)
      setWorkspaces((prev) => [ws, ...prev])
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
      setWorkspaces((prev) => prev.filter((w) => w.id !== leaveTarget.id))
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
          <div className="flex flex-col gap-2.5">
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

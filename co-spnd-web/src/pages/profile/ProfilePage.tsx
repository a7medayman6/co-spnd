import { useState, type FormEvent } from 'react'
import { LogOut, Plus, Trash2, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { usersService } from '../../services/users.service'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import {
  getParserKeywords,
  saveParserKeywords,
  resetParserKeywords,
  DEFAULT_KEYWORDS,
  type ParserKeyword,
} from '../../utils/messageParser'
import { CATEGORIES } from '../../types'

export function ProfilePage() {
  const { user, logout, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState(user?.name ?? '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // parser keyword state
  const [keywords, setKeywords] = useState<ParserKeyword[]>(() => getParserKeywords())
  const [newKeyword, setNewKeyword] = useState('')
  const [newCategory, setNewCategory] = useState<string>(CATEGORIES[0])
  const [kwError, setKwError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setIsLoading(true)
    setSuccess(false)
    setError('')
    try {
      await usersService.updateProfile({
        name: name.trim(),
        avatarUrl: avatarUrl.trim() || undefined,
      })
      await refreshUser()
      setSuccess(true)
    } catch {
      setError('Failed to update profile.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  function addKeyword() {
    const kw = newKeyword.trim().toLowerCase()
    if (!kw) { setKwError('Enter a keyword.'); return }
    if (keywords.some((k) => k.keyword.toLowerCase() === kw)) {
      setKwError('Keyword already exists.')
      return
    }
    const updated = [{ keyword: kw, category: newCategory }, ...keywords]
    setKeywords(updated)
    saveParserKeywords(updated)
    setNewKeyword('')
    setKwError('')
  }

  function removeKeyword(index: number) {
    const updated = keywords.filter((_, i) => i !== index)
    setKeywords(updated)
    saveParserKeywords(updated)
  }

  function handleReset() {
    resetParserKeywords()
    setKeywords(DEFAULT_KEYWORDS)
  }

  return (
    <div className="min-h-screen bg-surface pb-10">
      {/* Header */}
      <div className="px-5 pt-12 lg:pt-10 pb-6 flex items-start justify-between">
        <div>
          <h1 className="text-[1.75rem] font-extrabold text-[#0E0C0A] tracking-tight">
            Profile
          </h1>
          <p className="text-sm text-[#8C8479] mt-1 truncate max-w-[200px]">
            {user?.email}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 mt-2 text-[13px] font-semibold text-[#B5ADA4] hover:text-[#8C8479] transition-colors"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>

      <div className="px-5 flex flex-col gap-6">
        {/* Avatar */}
        <div className="flex justify-center">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-20 h-20 rounded-full object-cover ring-4 ring-white shadow-md"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-100 ring-4 ring-white shadow-md flex items-center justify-center">
              <span className="text-2xl font-extrabold text-gray-400">
                {user?.name?.[0]?.toUpperCase() ?? '?'}
              </span>
            </div>
          )}
        </div>

        {/* Profile form */}
        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />
            <Input
              label="Avatar URL"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              hint="Link to a profile photo (optional)"
            />
            {error && (
              <p className="text-sm text-red-500 font-medium bg-red-50 px-4 py-2.5 rounded-xl">
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-emerald-600 font-medium">Profile updated!</p>
            )}
            <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
              Save changes
            </Button>
          </form>
        </Card>

        {/* ── Message parsing keywords ───────────────────────────────── */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-xs font-bold tracking-[0.12em] uppercase text-gray-400">
              Message parsing keywords
            </p>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
            >
              <RotateCcw size={11} />
              Reset to defaults
            </button>
          </div>
          <p className="text-sm text-gray-400 mb-4 leading-relaxed">
            When you paste a bank message, these keywords decide which category gets picked.
            Your keywords are checked first.
          </p>

          {/* Add new keyword */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-4 mb-3">
            <p className="text-xs font-semibold text-gray-500 mb-3">Add keyword</p>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="e.g. starbucks"
                value={newKeyword}
                onChange={(e) => { setNewKeyword(e.target.value); setKwError('') }}
                onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
                className="flex-1 px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-gray-400 transition-colors"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-gray-400 transition-colors"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            {kwError && (
              <p className="text-xs text-red-500 font-medium mb-2">{kwError}</p>
            )}
            <button
              type="button"
              onClick={addKeyword}
              className="flex items-center gap-1.5 text-sm font-semibold text-[#863bff] hover:text-[#6a2fd4] transition-colors"
            >
              <Plus size={14} />
              Add
            </button>
          </div>

          {/* Keyword list */}
          <div className="flex flex-col gap-2">
            {keywords.map((kw, i) => (
              <div
                key={`${kw.keyword}-${i}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] px-4 py-3 flex items-center gap-3"
              >
                <span className="flex-1 text-sm font-mono text-gray-700">{kw.keyword}</span>
                <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">
                  {kw.category}
                </span>
                <button
                  onClick={() => removeKeyword(i)}
                  className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

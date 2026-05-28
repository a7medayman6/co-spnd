import { useState, type FormEvent } from 'react'
import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { usersService } from '../../services/users.service'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'

export function ProfilePage() {
  const { user, logout, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState(user?.name ?? '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

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

  return (
    <div className="min-h-screen bg-surface">
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

      <div className="px-5">
        {/* Avatar */}
        <div className="flex justify-center mb-6">
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

        {/* Form */}
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
              <p className="text-sm text-emerald-600 font-medium">
                Profile updated!
              </p>
            )}
            <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
              Save changes
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}

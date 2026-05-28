import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { authService } from '../../services/auth.service'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Logo } from '../../components/ui/Logo'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const res = await authService.login(email, password)
      login(res.accessToken, res.user)
      navigate('/workspaces', { replace: true })
    } catch {
      setError('Invalid email or password.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <Logo size="md" className="mb-10" />

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-[1.9rem] font-extrabold text-[#0E0C0A] tracking-tight leading-tight">
            Welcome back
          </h1>
          <p className="text-[#8C8479] mt-1.5 text-[15px]">
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-600 tracking-tight">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 pr-11 bg-white border border-gray-200 rounded-2xl text-gray-950 placeholder-gray-300 text-sm outline-none transition-all duration-150 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#B5ADA4] hover:text-[#8C8479] transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-500 font-medium bg-red-50 px-4 py-2.5 rounded-xl">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" isLoading={isLoading} className="w-full mt-2">
            Sign in
          </Button>
        </form>

        <p className="text-center text-sm text-[#8C8479] mt-8">
          New to Co-Spnd?{' '}
          <Link to="/register" className="text-[#0E0C0A] font-semibold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}

import { createContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from '../types'
import { usersService } from '../services/users.service'

const SESSION_DAYS = 30
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000
const TOKEN_KEY = 'token'
const USER_KEY = 'user'
const EXPIRES_AT_KEY = 'auth_expires_at'

function clearStoredSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(EXPIRES_AT_KEY)
}

function getValidStoredToken() {
  const storedToken = localStorage.getItem(TOKEN_KEY)
  const expiresAt = Number(localStorage.getItem(EXPIRES_AT_KEY) ?? '0')

  if (!storedToken || !expiresAt || Date.now() > expiresAt) {
    clearStoredSession()
    return null
  }

  return storedToken
}

function getStoredUser() {
  const storedUser = localStorage.getItem(USER_KEY)
  if (!storedUser) return null

  try {
    return JSON.parse(storedUser) as User
  } catch {
    return null
  }
}

interface AuthContextValue {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (token: string, user: User) => void
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initialToken] = useState(() => getValidStoredToken())
  const [user, setUser] = useState<User | null>(() => (initialToken ? getStoredUser() : null))
  const [token, setToken] = useState<string | null>(initialToken)
  const [isLoading, setIsLoading] = useState(() => Boolean(initialToken))

  useEffect(() => {
    if (!token) {
      return
    }

    usersService
      .getMe()
      .then((u) => setUser(u))
      .catch(() => {
        clearStoredSession()
        setToken(null)
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [token])

  function login(newToken: string, newUser: User) {
    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(USER_KEY, JSON.stringify(newUser))
    localStorage.setItem(EXPIRES_AT_KEY, String(Date.now() + SESSION_MS))
    setToken(newToken)
    setUser(newUser)
  }

  function logout() {
    clearStoredSession()
    setToken(null)
    setUser(null)
  }

  async function refreshUser() {
    const updated = await usersService.getMe()
    setUser(updated)
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }

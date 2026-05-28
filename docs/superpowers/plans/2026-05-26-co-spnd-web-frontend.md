# Co-Spnd Web Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Co-Spnd mobile-first frontend as a React + Vite + TypeScript + TailwindCSS app consuming the existing NestJS backend API.

**Architecture:** Single-page app with React Router v6 for routing, Axios for API calls with JWT interceptors, and React Context for auth state. The app is workspace-scoped — after login the user lands on a workspace selector, then navigates between transactions, analytics, and members within the selected workspace via a persistent bottom navigation bar.

**Tech Stack:** React 18, Vite, TypeScript, TailwindCSS v3, React Router v6, Axios, Recharts, Lucide React (icons)

---

## File Map

```
co-spnd-web/
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── tsconfig.node.json
├── .env.example
├── package.json
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── types/
    │   └── index.ts
    ├── services/
    │   ├── api.ts
    │   ├── auth.service.ts
    │   ├── users.service.ts
    │   ├── workspaces.service.ts
    │   ├── transactions.service.ts
    │   └── analytics.service.ts
    ├── contexts/
    │   └── AuthContext.tsx
    ├── hooks/
    │   └── useAuth.ts
    ├── utils/
    │   └── date.ts
    ├── components/
    │   ├── ui/
    │   │   ├── Button.tsx
    │   │   ├── Input.tsx
    │   │   ├── Card.tsx
    │   │   ├── Modal.tsx
    │   │   ├── BottomSheet.tsx
    │   │   ├── EmptyState.tsx
    │   │   ├── LoadingSpinner.tsx
    │   │   └── Badge.tsx
    │   └── layout/
    │       ├── ProtectedRoute.tsx
    │       ├── AppLayout.tsx
    │       └── BottomNav.tsx
    └── pages/
        ├── auth/
        │   ├── LoginPage.tsx
        │   └── RegisterPage.tsx
        ├── onboarding/
        │   └── OnboardingPage.tsx
        ├── workspaces/
        │   ├── WorkspacesPage.tsx
        │   └── MembersPage.tsx
        ├── transactions/
        │   ├── TransactionsPage.tsx
        │   └── AddTransactionSheet.tsx
        ├── analytics/
        │   └── AnalyticsPage.tsx
        └── profile/
            └── ProfilePage.tsx
```

---

## Routes

| Path | Component | Auth |
|------|-----------|------|
| `/onboarding` | OnboardingPage | Public |
| `/login` | LoginPage | Public |
| `/register` | RegisterPage | Public |
| `/workspaces` | WorkspacesPage | Required |
| `/workspaces/:id/transactions` | TransactionsPage (in AppLayout) | Required |
| `/workspaces/:id/analytics` | AnalyticsPage (in AppLayout) | Required |
| `/workspaces/:id/members` | MembersPage (in AppLayout) | Required |
| `/workspaces/:id/profile` | ProfilePage (in AppLayout) | Required |
| `/` | Redirect → `/workspaces` or `/login` | — |

---

## Task 1: Scaffold Vite + React + TypeScript project

**Files:**
- Create: `co-spnd-web/` (entire project scaffold)

- [ ] **Step 1: Run Vite scaffold from the repo root**

```bash
cd /home/abed/Local/Personal/dev/co-spnd
npm create vite@latest co-spnd-web -- --template react-ts
cd co-spnd-web
```

- [ ] **Step 2: Install all dependencies**

```bash
npm install react-router-dom axios recharts lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 3: Verify install**

```bash
npm run build
```

Expected: build succeeds with no errors (default Vite template).

- [ ] **Step 4: Commit**

```bash
cd /home/abed/Local/Personal/dev/co-spnd
git add co-spnd-web/
git commit -m "feat: scaffold co-spnd-web vite react-ts project"
```

---

## Task 2: Configure TailwindCSS, global styles, and env

**Files:**
- Modify: `co-spnd-web/tailwind.config.js`
- Modify: `co-spnd-web/src/index.css`
- Create: `co-spnd-web/.env.example`
- Create: `co-spnd-web/.env`
- Modify: `co-spnd-web/index.html`

- [ ] **Step 1: Replace tailwind.config.js**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
      },
      colors: {
        surface: '#FAFAFA',
        card: '#FFFFFF',
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 2: Replace src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

html, body, #root {
  height: 100%;
}

body {
  background-color: #FAFAFA;
  color: #1A1A1A;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Smooth scrolling for all scrollable areas */
* {
  -webkit-tap-highlight-color: transparent;
}
```

- [ ] **Step 3: Update index.html to add Inter font and mobile meta**

Replace the `<head>` block in `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <meta name="theme-color" content="#ffffff" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <title>Co-Spnd</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Create .env.example**

```
VITE_API_URL=http://localhost:3000/api/v1
```

- [ ] **Step 5: Create .env**

```
VITE_API_URL=http://localhost:3000/api/v1
```

- [ ] **Step 6: Verify Tailwind works**

```bash
cd co-spnd-web && npm run build
```

Expected: build succeeds.

- [ ] **Step 7: Commit**

```bash
git add co-spnd-web/
git commit -m "feat: configure tailwind, global styles, and env"
```

---

## Task 3: Define TypeScript types

**Files:**
- Create: `co-spnd-web/src/types/index.ts`

- [ ] **Step 1: Write types file**

```typescript
// co-spnd-web/src/types/index.ts

export interface User {
  id: string
  email: string
  name: string
  avatarUrl: string | null
}

export interface AuthResponse {
  accessToken: string
  user: User
}

export interface Workspace {
  id: string
  name: string
  currency: string
  createdBy?: string
  membersCount?: number
}

export interface WorkspaceMember {
  id: string
  name: string
  email: string
}

export interface Transaction {
  id: string
  amount: number
  category: string
  description?: string
  date: string
  spenderId: string
  spenderName?: string
  createdBy: string
  workspaceId: string
}

export interface CreateTransactionDto {
  amount: number
  category: string
  description?: string
  date?: string
  spenderId?: string
}

export interface UpdateTransactionDto {
  amount?: number
  category?: string
  description?: string
  date?: string
  spenderId?: string
}

export interface Analytics {
  total: number
  byCategory: Array<{ category: string; total: number }>
  byUser: Array<{ userId: string; name: string; total: number }>
}

export const CATEGORIES = [
  'Food',
  'Transport',
  'Accommodation',
  'Entertainment',
  'Shopping',
  'Health',
  'Other',
] as const

export type Category = (typeof CATEGORIES)[number]
```

- [ ] **Step 2: Type-check**

```bash
cd co-spnd-web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add co-spnd-web/src/types/
git commit -m "feat: add typescript types"
```

---

## Task 4: Create API services

**Files:**
- Create: `co-spnd-web/src/services/api.ts`
- Create: `co-spnd-web/src/services/auth.service.ts`
- Create: `co-spnd-web/src/services/users.service.ts`
- Create: `co-spnd-web/src/services/workspaces.service.ts`
- Create: `co-spnd-web/src/services/transactions.service.ts`
- Create: `co-spnd-web/src/services/analytics.service.ts`

- [ ] **Step 1: Create api.ts — Axios instance with interceptors**

```typescript
// co-spnd-web/src/services/api.ts
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

- [ ] **Step 2: Create auth.service.ts**

```typescript
// co-spnd-web/src/services/auth.service.ts
import api from './api'
import type { AuthResponse } from '../types'

export const authService = {
  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', { email, password, name })
    return data
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password })
    return data
  },
}
```

- [ ] **Step 3: Create users.service.ts**

```typescript
// co-spnd-web/src/services/users.service.ts
import api from './api'
import type { User } from '../types'

export const usersService = {
  async getMe(): Promise<User> {
    const { data } = await api.get<User>('/users/me')
    return data
  },

  async updateProfile(payload: { name?: string; avatarUrl?: string }): Promise<User> {
    const { data } = await api.put<User>('/users/me', payload)
    return data
  },
}
```

- [ ] **Step 4: Create workspaces.service.ts**

```typescript
// co-spnd-web/src/services/workspaces.service.ts
import api from './api'
import type { Workspace, WorkspaceMember } from '../types'

export const workspacesService = {
  async list(): Promise<Workspace[]> {
    const { data } = await api.get<Workspace[]>('/workspaces')
    return data
  },

  async create(name: string, currency: string): Promise<Workspace> {
    const { data } = await api.post<Workspace>('/workspaces', { name, currency })
    return data
  },

  async invite(workspaceId: string, email: string): Promise<{ success: boolean }> {
    const { data } = await api.post<{ success: boolean }>(
      `/workspaces/${workspaceId}/invite`,
      { email }
    )
    return data
  },

  async getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const { data } = await api.get<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`)
    return data
  },
}
```

- [ ] **Step 5: Create transactions.service.ts**

```typescript
// co-spnd-web/src/services/transactions.service.ts
import api from './api'
import type { Transaction, CreateTransactionDto, UpdateTransactionDto } from '../types'

export const transactionsService = {
  async list(workspaceId: string, from?: string, to?: string): Promise<Transaction[]> {
    const params: Record<string, string> = {}
    if (from) params.from = from
    if (to) params.to = to
    const { data } = await api.get<Transaction[]>(
      `/workspaces/${workspaceId}/transactions`,
      { params }
    )
    return data
  },

  async create(workspaceId: string, dto: CreateTransactionDto): Promise<Transaction> {
    const { data } = await api.post<Transaction>(
      `/workspaces/${workspaceId}/transactions`,
      dto
    )
    return data
  },

  async update(transactionId: string, dto: UpdateTransactionDto): Promise<Transaction> {
    const { data } = await api.put<Transaction>(`/transactions/${transactionId}`, dto)
    return data
  },

  async delete(transactionId: string): Promise<void> {
    await api.delete(`/transactions/${transactionId}`)
  },
}
```

- [ ] **Step 6: Create analytics.service.ts**

```typescript
// co-spnd-web/src/services/analytics.service.ts
import api from './api'
import type { Analytics } from '../types'

export const analyticsService = {
  async get(workspaceId: string, from?: string, to?: string): Promise<Analytics> {
    const params: Record<string, string> = {}
    if (from) params.from = from
    if (to) params.to = to
    const { data } = await api.get<Analytics>(
      `/workspaces/${workspaceId}/analytics`,
      { params }
    )
    return data
  },
}
```

- [ ] **Step 7: Type-check all services**

```bash
cd co-spnd-web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add co-spnd-web/src/services/
git commit -m "feat: add api services for all backend endpoints"
```

---

## Task 5: Auth context and hook

**Files:**
- Create: `co-spnd-web/src/contexts/AuthContext.tsx`
- Create: `co-spnd-web/src/hooks/useAuth.ts`

- [ ] **Step 1: Create AuthContext.tsx**

```typescript
// co-spnd-web/src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from '../types'
import { usersService } from '../services/users.service'

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
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (!storedToken) {
      setIsLoading(false)
      return
    }
    setToken(storedToken)
    usersService
      .getMe()
      .then((u) => setUser(u))
      .catch(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      })
      .finally(() => setIsLoading(false))
  }, [])

  function login(newToken: string, newUser: User) {
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setUser(newUser)
  }

  function logout() {
    localStorage.removeItem('token')
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
```

- [ ] **Step 2: Create useAuth.ts**

```typescript
// co-spnd-web/src/hooks/useAuth.ts
import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
```

- [ ] **Step 3: Type-check**

```bash
cd co-spnd-web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add co-spnd-web/src/contexts/ co-spnd-web/src/hooks/
git commit -m "feat: add auth context and hook"
```

---

## Task 6: UI primitives

**Files:**
- Create: `co-spnd-web/src/components/ui/Button.tsx`
- Create: `co-spnd-web/src/components/ui/Input.tsx`
- Create: `co-spnd-web/src/components/ui/Card.tsx`
- Create: `co-spnd-web/src/components/ui/Modal.tsx`
- Create: `co-spnd-web/src/components/ui/BottomSheet.tsx`
- Create: `co-spnd-web/src/components/ui/EmptyState.tsx`
- Create: `co-spnd-web/src/components/ui/LoadingSpinner.tsx`
- Create: `co-spnd-web/src/components/ui/Badge.tsx`

- [ ] **Step 1: Create Button.tsx**

```typescript
// co-spnd-web/src/components/ui/Button.tsx
import { type ButtonHTMLAttributes, type ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  children: ReactNode
}

const variantClasses = {
  primary: 'bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-950',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 active:bg-gray-200',
  danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3.5 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : null}
      {children}
    </button>
  )
}
```

- [ ] **Step 2: Create Input.tsx**

```typescript
// co-spnd-web/src/components/ui/Input.tsx
import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-gray-700">{label}</label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-3 bg-white border rounded-xl text-gray-900 placeholder-gray-400 text-sm outline-none transition-all focus:border-gray-400 focus:ring-2 focus:ring-gray-200 disabled:bg-gray-50 disabled:text-gray-400 ${
            error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : 'border-gray-200'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
```

- [ ] **Step 3: Create Card.tsx**

```typescript
// co-spnd-web/src/components/ui/Card.tsx
import { type HTMLAttributes, type ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: boolean
}

export function Card({ children, padding = true, className = '', ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${
        padding ? 'p-4' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 4: Create Modal.tsx**

```typescript
// co-spnd-web/src/components/ui/Modal.tsx
import { type ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl z-10">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          {title && <h2 className="text-base font-semibold text-gray-900">{title}</h2>}
          <button
            onClick={onClose}
            className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create BottomSheet.tsx**

```typescript
// co-spnd-web/src/components/ui/BottomSheet.tsx
import { type ReactNode, useEffect } from 'react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative w-full bg-white rounded-t-3xl shadow-2xl z-10 transition-transform duration-300 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        {title && (
          <div className="px-5 pt-2 pb-3 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          </div>
        )}
        <div className="p-5 pb-safe overflow-y-auto max-h-[80vh]">{children}</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create EmptyState.tsx**

```typescript
// co-spnd-web/src/components/ui/EmptyState.tsx
import { type ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && <div className="text-gray-300 mb-4">{icon}</div>}
      <p className="text-gray-700 font-medium text-base">{title}</p>
      {description && <p className="text-gray-400 text-sm mt-1.5 max-w-xs">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
```

- [ ] **Step 7: Create LoadingSpinner.tsx**

```typescript
// co-spnd-web/src/components/ui/LoadingSpinner.tsx
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }
const borderMap = { sm: 'border-2', md: 'border-2', lg: 'border-[3px]' }

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  return (
    <div
      className={`${sizeMap[size]} ${borderMap[size]} border-gray-200 border-t-gray-600 rounded-full animate-spin ${className}`}
    />
  )
}

export function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-surface">
      <LoadingSpinner size="lg" />
    </div>
  )
}
```

- [ ] **Step 8: Create Badge.tsx**

```typescript
// co-spnd-web/src/components/ui/Badge.tsx

const CATEGORY_COLORS: Record<string, string> = {
  Food: 'bg-orange-100 text-orange-700',
  Transport: 'bg-blue-100 text-blue-700',
  Accommodation: 'bg-purple-100 text-purple-700',
  Entertainment: 'bg-pink-100 text-pink-700',
  Shopping: 'bg-green-100 text-green-700',
  Health: 'bg-teal-100 text-teal-700',
  Other: 'bg-gray-100 text-gray-600',
}

interface BadgeProps {
  label: string
  colorKey?: string
}

export function Badge({ label, colorKey }: BadgeProps) {
  const colorClass = colorKey ? (CATEGORY_COLORS[colorKey] ?? 'bg-gray-100 text-gray-600') : 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  )
}
```

- [ ] **Step 9: Type-check**

```bash
cd co-spnd-web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add co-spnd-web/src/components/ui/
git commit -m "feat: add ui primitives (Button, Input, Card, Modal, BottomSheet, etc)"
```

---

## Task 7: Date utility

**Files:**
- Create: `co-spnd-web/src/utils/date.ts`

- [ ] **Step 1: Create date.ts**

```typescript
// co-spnd-web/src/utils/date.ts

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function getMonthRange(date: Date = new Date()): { from: string; to: string } {
  const year = date.getFullYear()
  const month = date.getMonth()
  const from = new Date(year, month, 1).toISOString().split('T')[0]
  const to = new Date(year, month + 1, 0).toISOString().split('T')[0]
  return { from, to }
}

export function toInputDateValue(dateStr?: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0]
  return new Date(dateStr).toISOString().split('T')[0]
}

export function getMonthLabel(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}
```

- [ ] **Step 2: Commit**

```bash
git add co-spnd-web/src/utils/
git commit -m "feat: add date and currency utility functions"
```

---

## Task 8: Layout components and routing

**Files:**
- Create: `co-spnd-web/src/components/layout/ProtectedRoute.tsx`
- Create: `co-spnd-web/src/components/layout/AppLayout.tsx`
- Create: `co-spnd-web/src/components/layout/BottomNav.tsx`
- Modify: `co-spnd-web/src/main.tsx`
- Modify: `co-spnd-web/src/App.tsx`

- [ ] **Step 1: Create ProtectedRoute.tsx**

```typescript
// co-spnd-web/src/components/layout/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { PageLoader } from '../ui/LoadingSpinner'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}
```

- [ ] **Step 2: Create BottomNav.tsx**

```typescript
// co-spnd-web/src/components/layout/BottomNav.tsx
import { NavLink, useParams } from 'react-router-dom'
import { Receipt, BarChart2, Users, User } from 'lucide-react'

export function BottomNav() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  if (!workspaceId) return null

  const navItems = [
    { to: `/workspaces/${workspaceId}/transactions`, icon: Receipt, label: 'Expenses' },
    { to: `/workspaces/${workspaceId}/analytics`, icon: BarChart2, label: 'Analytics' },
    { to: `/workspaces/${workspaceId}/members`, icon: Users, label: 'Members' },
    { to: `/workspaces/${workspaceId}/profile`, icon: User, label: 'Profile' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 pb-safe">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors min-w-[60px] ${
                isActive
                  ? 'text-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className={`text-[10px] font-medium ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
```

- [ ] **Step 3: Create AppLayout.tsx**

```typescript
// co-spnd-web/src/components/layout/AppLayout.tsx
import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-surface">
      <main className="pb-20 max-w-lg mx-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
```

- [ ] **Step 4: Write App.tsx**

```typescript
// co-spnd-web/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { OnboardingPage } from './pages/onboarding/OnboardingPage'
import { WorkspacesPage } from './pages/workspaces/WorkspacesPage'
import { TransactionsPage } from './pages/transactions/TransactionsPage'
import { AnalyticsPage } from './pages/analytics/AnalyticsPage'
import { MembersPage } from './pages/workspaces/MembersPage'
import { ProfilePage } from './pages/profile/ProfilePage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected — no bottom nav */}
          <Route
            path="/workspaces"
            element={
              <ProtectedRoute>
                <WorkspacesPage />
              </ProtectedRoute>
            }
          />

          {/* Protected — with bottom nav */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/workspaces/:workspaceId/transactions" element={<TransactionsPage />} />
            <Route path="/workspaces/:workspaceId/analytics" element={<AnalyticsPage />} />
            <Route path="/workspaces/:workspaceId/members" element={<MembersPage />} />
            <Route path="/workspaces/:workspaceId/profile" element={<ProfilePage />} />
          </Route>

          {/* Root redirect */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

function RootRedirect() {
  const hasToken = Boolean(localStorage.getItem('token'))
  const hasSeenOnboarding = Boolean(localStorage.getItem('onboarding_seen'))
  if (!hasSeenOnboarding) return <Navigate to="/onboarding" replace />
  if (!hasToken) return <Navigate to="/login" replace />
  return <Navigate to="/workspaces" replace />
}
```

- [ ] **Step 5: Update main.tsx**

```typescript
// co-spnd-web/src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 6: Delete default Vite boilerplate files that are no longer needed**

```bash
rm -f co-spnd-web/src/App.css co-spnd-web/src/assets/react.svg co-spnd-web/public/vite.svg
```

Note: Update `index.html` to remove the favicon reference if it causes a 404 warning, or replace vite.svg with a simple one.

- [ ] **Step 7: Type-check**

```bash
cd co-spnd-web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add co-spnd-web/src/
git commit -m "feat: add layout components and app router"
```

---

## Task 9: Login and Register pages

**Files:**
- Create: `co-spnd-web/src/pages/auth/LoginPage.tsx`
- Create: `co-spnd-web/src/pages/auth/RegisterPage.tsx`

- [ ] **Step 1: Create LoginPage.tsx**

```typescript
// co-spnd-web/src/pages/auth/LoginPage.tsx
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { authService } from '../../services/auth.service'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    <div className="min-h-screen bg-surface flex flex-col justify-center px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back</h1>
        <p className="text-gray-400 mt-2 text-sm">Sign in to your account</p>
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
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" size="lg" isLoading={isLoading} className="w-full mt-2">
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm text-gray-400 mt-8">
        Don't have an account?{' '}
        <Link to="/register" className="text-gray-900 font-medium hover:underline">
          Create one
        </Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Create RegisterPage.tsx**

```typescript
// co-spnd-web/src/pages/auth/RegisterPage.tsx
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { authService } from '../../services/auth.service'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export function RegisterPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setIsLoading(true)
    try {
      const res = await authService.register(email, password, name)
      login(res.accessToken, res.user)
      navigate('/workspaces', { replace: true })
    } catch {
      setError('Registration failed. Email may already be in use.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Create account</h1>
        <p className="text-gray-400 mt-2 text-sm">Start tracking shared expenses</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Name"
          type="text"
          placeholder="Ahmed"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />
        <Input
          label="Email"
          type="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" size="lg" isLoading={isLoading} className="w-full mt-2">
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-gray-400 mt-8">
        Already have an account?{' '}
        <Link to="/login" className="text-gray-900 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
cd co-spnd-web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add co-spnd-web/src/pages/auth/
git commit -m "feat: add login and register pages"
```

---

## Task 10: Onboarding flow

**Files:**
- Create: `co-spnd-web/src/pages/onboarding/OnboardingPage.tsx`

- [ ] **Step 1: Create OnboardingPage.tsx**

```typescript
// co-spnd-web/src/pages/onboarding/OnboardingPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Zap, BarChart2, ArrowRight } from 'lucide-react'
import { Button } from '../../components/ui/Button'

const SLIDES = [
  {
    icon: Users,
    title: 'Shared spaces,\nzero confusion',
    description: 'Create a workspace with anyone. Trips, households, events — keep finances together.',
    color: 'bg-blue-50',
    iconColor: 'text-blue-500',
  },
  {
    icon: Zap,
    title: 'Log expenses\nin seconds',
    description: 'Amount and category. That\'s it. Everything else is optional.',
    color: 'bg-amber-50',
    iconColor: 'text-amber-500',
  },
  {
    icon: BarChart2,
    title: 'See who spent\nwhat and where',
    description: 'Instant analytics by category and person. No spreadsheets needed.',
    color: 'bg-green-50',
    iconColor: 'text-green-500',
  },
]

export function OnboardingPage() {
  const [current, setCurrent] = useState(0)
  const navigate = useNavigate()

  function handleContinue() {
    if (current < SLIDES.length - 1) {
      setCurrent(current + 1)
    } else {
      localStorage.setItem('onboarding_seen', '1')
      navigate('/register')
    }
  }

  function handleSkip() {
    localStorage.setItem('onboarding_seen', '1')
    navigate('/login')
  }

  const slide = SLIDES[current]
  const Icon = slide.icon
  const isLast = current === SLIDES.length - 1

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Skip button */}
      <div className="flex justify-end p-5">
        <button
          onClick={handleSkip}
          className="text-sm text-gray-400 hover:text-gray-600 font-medium"
        >
          Skip
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-8">
        <div className={`w-28 h-28 rounded-3xl ${slide.color} flex items-center justify-center mb-10`}>
          <Icon size={52} className={slide.iconColor} strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 text-center leading-tight whitespace-pre-line tracking-tight">
          {slide.title}
        </h1>
        <p className="text-gray-400 text-base text-center mt-4 leading-relaxed max-w-xs">
          {slide.description}
        </p>
      </div>

      {/* Navigation */}
      <div className="px-8 pb-12">
        {/* Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current ? 'w-6 h-2 bg-gray-900' : 'w-2 h-2 bg-gray-200'
              }`}
            />
          ))}
        </div>

        <Button
          onClick={handleContinue}
          size="lg"
          className="w-full flex items-center justify-center gap-2"
        >
          {isLast ? 'Get started' : 'Continue'}
          <ArrowRight size={18} />
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
cd co-spnd-web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add co-spnd-web/src/pages/onboarding/
git commit -m "feat: add onboarding flow (3 slides)"
```

---

## Task 11: Workspaces page

**Files:**
- Create: `co-spnd-web/src/pages/workspaces/WorkspacesPage.tsx`

- [ ] **Step 1: Create WorkspacesPage.tsx**

```typescript
// co-spnd-web/src/pages/workspaces/WorkspacesPage.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, LogOut, ChevronRight } from 'lucide-react'
import { workspacesService } from '../../services/workspaces.service'
import { useAuth } from '../../hooks/useAuth'
import type { Workspace } from '../../types'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

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

  useEffect(() => {
    workspacesService
      .list()
      .then(setWorkspaces)
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
    } catch {
      setCreateError('Failed to create workspace.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="px-5 pt-14 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-400 font-medium">Hey, {user?.name?.split(' ')[0]} 👋</p>
            <h1 className="text-2xl font-bold text-gray-900 mt-1 tracking-tight">Your Workspaces</h1>
          </div>
          <button
            onClick={logout}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-5">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : workspaces.length === 0 ? (
          <EmptyState
            icon={<Users size={48} />}
            title="No workspaces yet"
            description="Create your first workspace to start tracking shared expenses."
            action={
              <Button onClick={() => setShowCreate(true)}>
                <Plus size={16} />
                New Workspace
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {workspaces.map((ws) => (
              <Card
                key={ws.id}
                className="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
                onClick={() => navigate(`/workspaces/${ws.id}/transactions`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{ws.name}</p>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {ws.membersCount ?? 1} member{(ws.membersCount ?? 1) !== 1 ? 's' : ''} · {ws.currency}
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-gray-300" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      {workspaces.length > 0 && (
        <button
          onClick={() => setShowCreate(true)}
          className="fixed bottom-8 right-5 w-14 h-14 bg-gray-900 text-white rounded-2xl shadow-lg hover:bg-gray-800 active:scale-95 transition-all flex items-center justify-center"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Workspace">
        <div className="flex flex-col gap-4">
          <Input
            label="Workspace name"
            placeholder="e.g. Trip to Dubai"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          {createError && <p className="text-sm text-red-500">{createError}</p>}
          <Button
            onClick={handleCreate}
            isLoading={creating}
            className="w-full"
            size="lg"
          >
            Create
          </Button>
        </div>
      </Modal>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
cd co-spnd-web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add co-spnd-web/src/pages/workspaces/
git commit -m "feat: add workspaces page with create workspace modal"
```

---

## Task 12: Transactions page

**Files:**
- Create: `co-spnd-web/src/pages/transactions/TransactionsPage.tsx`
- Create: `co-spnd-web/src/pages/transactions/AddTransactionSheet.tsx`

- [ ] **Step 1: Create AddTransactionSheet.tsx**

```typescript
// co-spnd-web/src/pages/transactions/AddTransactionSheet.tsx
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { transactionsService } from '../../services/transactions.service'
import { workspacesService } from '../../services/workspaces.service'
import { useAuth } from '../../hooks/useAuth'
import type { Transaction, WorkspaceMember } from '../../types'
import { CATEGORIES } from '../../types'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { toInputDateValue } from '../../utils/date'

interface AddTransactionSheetProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
  onAdded: (tx: Transaction) => void
}

export function AddTransactionSheet({
  isOpen,
  onClose,
  workspaceId,
  onAdded,
}: AddTransactionSheetProps) {
  const { user } = useAuth()
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(toInputDateValue())
  const [spenderId, setSpenderId] = useState('')
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [showMore, setShowMore] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      workspacesService.getMembers(workspaceId).then(setMembers).catch(() => {})
      setSpenderId(user?.id ?? '')
    }
  }, [isOpen, workspaceId, user])

  function resetForm() {
    setAmount('')
    setCategory(CATEGORIES[0])
    setDescription('')
    setDate(toInputDateValue())
    setSpenderId(user?.id ?? '')
    setShowMore(false)
    setError('')
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  async function handleSubmit() {
    const parsedAmount = parseFloat(amount)
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Enter a valid amount.')
      return
    }
    setError('')
    setIsLoading(true)
    try {
      const tx = await transactionsService.create(workspaceId, {
        amount: parsedAmount,
        category,
        description: description.trim() || undefined,
        date,
        spenderId: spenderId || undefined,
      })
      onAdded(tx)
      handleClose()
    } catch {
      setError('Failed to add transaction.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title="Add expense">
      <div className="flex flex-col gap-4">
        {/* Amount — primary, large */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Amount</label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
            className="w-full px-4 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 text-2xl font-semibold outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all placeholder-gray-200"
          />
        </div>

        {/* Category — primary */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Category</label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all ${
                  category === cat
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* More options toggle */}
        <button
          type="button"
          onClick={() => setShowMore(!showMore)}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 self-start transition-colors"
        >
          {showMore ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {showMore ? 'Hide details' : 'More details'}
        </button>

        {/* Optional fields */}
        {showMore && (
          <div className="flex flex-col gap-4 border-t border-gray-100 pt-4">
            <Input
              label="Description"
              placeholder="What was this for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            {members.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Paid by</label>
                <select
                  value={spenderId}
                  onChange={(e) => setSpenderId(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}{m.id === user?.id ? ' (you)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          onClick={handleSubmit}
          isLoading={isLoading}
          size="lg"
          className="w-full"
        >
          Add expense
        </Button>
      </div>
    </BottomSheet>
  )
}
```

- [ ] **Step 2: Create TransactionsPage.tsx**

```typescript
// co-spnd-web/src/pages/transactions/TransactionsPage.tsx
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Trash2, Pencil, Receipt } from 'lucide-react'
import { transactionsService } from '../../services/transactions.service'
import { workspacesService } from '../../services/workspaces.service'
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
      description: tx.description,
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
    } finally {
      setDeleteLoading(false)
    }
  }

  const total = transactions.reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="px-5 pt-14 pb-5">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {workspace?.name ?? 'Workspace'}
        </p>
        <h1 className="text-2xl font-bold text-gray-900 mt-1 tracking-tight">Expenses</h1>
        {transactions.length > 0 && (
          <p className="text-gray-400 text-sm mt-1">
            Total: <span className="font-semibold text-gray-700">{formatCurrency(total, workspace?.currency)}</span>
          </p>
        )}
      </div>

      {/* List */}
      <div className="px-5">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={<Receipt size={48} />}
            title="No expenses yet"
            description="Tap + to add your first expense."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {transactions.map((tx) => {
              const isOwner = tx.createdBy === user?.id
              return (
                <div
                  key={tx.id}
                  className="bg-white rounded-2xl border border-gray-100 px-4 py-3.5 flex items-center justify-between shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(tx.amount, workspace?.currency)}
                      </span>
                      <Badge label={tx.category} colorKey={tx.category} />
                    </div>
                    {tx.description && (
                      <p className="text-sm text-gray-500 mt-0.5 truncate">{tx.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(tx.date)}
                    </p>
                  </div>
                  {isOwner && (
                    <div className="flex items-center gap-1 ml-3 shrink-0">
                      <button
                        onClick={() => openEdit(tx)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(tx)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={15} />
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
        className="fixed bottom-24 right-5 w-14 h-14 bg-gray-900 text-white rounded-2xl shadow-lg hover:bg-gray-800 active:scale-95 transition-all flex items-center justify-center z-30"
      >
        <Plus size={24} />
      </button>

      {/* Add sheet */}
      <AddTransactionSheet
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        workspaceId={workspaceId!}
        onAdded={handleAdded}
      />

      {/* Edit modal */}
      <Modal isOpen={Boolean(editTarget)} onClose={() => setEditTarget(null)} title="Edit expense">
        <div className="flex flex-col gap-4">
          <Input
            label="Amount"
            type="number"
            value={editForm.amount?.toString() ?? ''}
            onChange={(e) => setEditForm((f) => ({ ...f, amount: parseFloat(e.target.value) }))}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Category</label>
            <select
              value={editForm.category ?? ''}
              onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
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

      {/* Delete confirm modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete expense"
      >
        <div className="flex flex-col gap-4">
          <p className="text-gray-600 text-sm">
            Are you sure you want to delete this expense? This cannot be undone.
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
```

- [ ] **Step 3: Type-check**

```bash
cd co-spnd-web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add co-spnd-web/src/pages/transactions/
git commit -m "feat: add transactions page with add/edit/delete flow"
```

---

## Task 13: Analytics page

**Files:**
- Create: `co-spnd-web/src/pages/analytics/AnalyticsPage.tsx`

- [ ] **Step 1: Create AnalyticsPage.tsx**

```typescript
// co-spnd-web/src/pages/analytics/AnalyticsPage.tsx
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { analyticsService } from '../../services/analytics.service'
import { workspacesService } from '../../services/workspaces.service'
import type { Analytics, Workspace } from '../../types'
import { formatCurrency, getMonthRange, getMonthLabel } from '../../utils/date'
import { Card } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { BarChart2 } from 'lucide-react'

const CHART_COLORS = [
  '#1A1A1A', '#6B7280', '#9CA3AF', '#D1D5DB',
  '#374151', '#4B5563', '#111827', '#F3F4F6',
]

export function AnalyticsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [monthOffset, setMonthOffset] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const currentDate = new Date()
  currentDate.setMonth(currentDate.getMonth() + monthOffset)
  const { from, to } = getMonthRange(currentDate)
  const monthLabel = getMonthLabel(currentDate)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setIsLoading(true)
    try {
      const [data, wsList] = await Promise.all([
        analyticsService.get(workspaceId, from, to),
        workspacesService.list(),
      ])
      setAnalytics(data)
      setWorkspace(wsList.find((w) => w.id === workspaceId) ?? null)
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId, from, to])

  useEffect(() => {
    load()
  }, [load])

  const pieData = analytics?.byCategory
    .filter((c) => c.total > 0)
    .map((c) => ({ name: c.category, value: c.total })) ?? []

  const hasData = analytics && analytics.total > 0

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="px-5 pt-14 pb-5">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          {workspace?.name ?? 'Workspace'}
        </p>
        <h1 className="text-2xl font-bold text-gray-900 mt-1 tracking-tight">Analytics</h1>
      </div>

      {/* Month navigation */}
      <div className="px-5 mb-5">
        <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 px-4 py-3 shadow-sm">
          <button
            onClick={() => setMonthOffset((o) => o - 1)}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-semibold text-gray-900">{monthLabel}</span>
          <button
            onClick={() => setMonthOffset((o) => o + 1)}
            disabled={monthOffset >= 0}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : !hasData ? (
        <EmptyState
          icon={<BarChart2 size={48} />}
          title="No data for this period"
          description="Add expenses to see analytics."
        />
      ) : (
        <div className="px-5 flex flex-col gap-4 pb-8">
          {/* Total card */}
          <Card>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
              Total spent
            </p>
            <p className="text-3xl font-bold text-gray-900 tracking-tight">
              {formatCurrency(analytics!.total, workspace?.currency)}
            </p>
          </Card>

          {/* By category pie chart */}
          {pieData.length > 0 && (
            <Card>
              <p className="text-sm font-semibold text-gray-700 mb-4">By Category</p>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) =>
                      formatCurrency(value, workspace?.currency)
                    }
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span className="text-xs text-gray-600">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* By category list */}
          {analytics!.byCategory.filter((c) => c.total > 0).length > 0 && (
            <Card>
              <p className="text-sm font-semibold text-gray-700 mb-3">Category breakdown</p>
              <div className="flex flex-col gap-2">
                {analytics!.byCategory
                  .filter((c) => c.total > 0)
                  .sort((a, b) => b.total - a.total)
                  .map((c) => {
                    const pct = analytics!.total > 0 ? (c.total / analytics!.total) * 100 : 0
                    return (
                      <div key={c.category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700">{c.category}</span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(c.total, workspace?.currency)}
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gray-700 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </Card>
          )}

          {/* By user */}
          {analytics!.byUser.filter((u) => u.total > 0).length > 0 && (
            <Card>
              <p className="text-sm font-semibold text-gray-700 mb-3">By person</p>
              <div className="flex flex-col gap-3">
                {analytics!.byUser
                  .filter((u) => u.total > 0)
                  .sort((a, b) => b.total - a.total)
                  .map((u) => (
                    <div key={u.userId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <span className="text-xs font-semibold text-gray-500">
                            {u.name?.[0]?.toUpperCase() ?? '?'}
                          </span>
                        </div>
                        <span className="text-sm text-gray-700">{u.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(u.total, workspace?.currency)}
                      </span>
                    </div>
                  ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
cd co-spnd-web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add co-spnd-web/src/pages/analytics/
git commit -m "feat: add analytics page with pie chart and breakdowns"
```

---

## Task 14: Members page

**Files:**
- Create: `co-spnd-web/src/pages/workspaces/MembersPage.tsx`

- [ ] **Step 1: Create MembersPage.tsx**

```typescript
// co-spnd-web/src/pages/workspaces/MembersPage.tsx
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { UserPlus, Users } from 'lucide-react'
import { workspacesService } from '../../services/workspaces.service'
import type { WorkspaceMember } from '../../types'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'

export function MembersPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [email, setEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState(false)

  useEffect(() => {
    if (!workspaceId) return
    workspacesService
      .getMembers(workspaceId)
      .then(setMembers)
      .finally(() => setIsLoading(false))
  }, [workspaceId])

  async function handleInvite() {
    if (!email.trim() || !workspaceId) return
    setInviting(true)
    setInviteError('')
    try {
      await workspacesService.invite(workspaceId, email.trim())
      setInviteSuccess(true)
      setEmail('')
      const updated = await workspacesService.getMembers(workspaceId)
      setMembers(updated)
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
      <div className="px-5 pt-14 pb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Members</h1>
          <p className="text-gray-400 text-sm mt-1">
            {members.length} member{members.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={() => setShowInvite(true)}
          variant="secondary"
          size="sm"
          className="flex items-center gap-1.5 mt-1"
        >
          <UserPlus size={15} />
          Invite
        </Button>
      </div>

      {/* List */}
      <div className="px-5">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : members.length === 0 ? (
          <EmptyState
            icon={<Users size={48} />}
            title="No members yet"
            description="Invite your friends to this workspace."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {members.map((m) => (
              <div
                key={m.id}
                className="bg-white rounded-2xl border border-gray-100 px-4 py-3.5 flex items-center gap-3 shadow-sm"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <span className="text-sm font-semibold text-gray-500">
                    {m.name?.[0]?.toUpperCase() ?? '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{m.name}</p>
                  <p className="text-xs text-gray-400 truncate">{m.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite modal */}
      <Modal isOpen={showInvite} onClose={handleCloseInvite} title="Invite member">
        <div className="flex flex-col gap-4">
          {inviteSuccess ? (
            <>
              <p className="text-sm text-green-600 font-medium">Invitation sent successfully!</p>
              <Button onClick={handleCloseInvite} className="w-full">
                Done
              </Button>
            </>
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
              {inviteError && <p className="text-sm text-red-500">{inviteError}</p>}
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
```

- [ ] **Step 2: Type-check**

```bash
cd co-spnd-web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add co-spnd-web/src/pages/workspaces/MembersPage.tsx
git commit -m "feat: add members page with invite flow"
```

---

## Task 15: Profile page

**Files:**
- Create: `co-spnd-web/src/pages/profile/ProfilePage.tsx`

- [ ] **Step 1: Create ProfilePage.tsx**

```typescript
// co-spnd-web/src/pages/profile/ProfilePage.tsx
import { useState, type FormEvent } from 'react'
import { LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { usersService } from '../../services/users.service'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'

export function ProfilePage() {
  const { user, logout, refreshUser } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
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

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="px-5 pt-14 pb-5 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Profile</h1>
          <p className="text-gray-400 text-sm mt-1">{user?.email}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mt-1.5 transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>

      <div className="px-5">
        {/* Avatar preview */}
        <div className="flex justify-center mb-6">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-20 h-20 rounded-full object-cover border-2 border-gray-100"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-400">
                {user?.name?.[0]?.toUpperCase() ?? '?'}
              </span>
            </div>
          )}
        </div>

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
              hint="Optional — link to a profile photo"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-600">Profile updated!</p>}
            <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
              Save changes
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
cd co-spnd-web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add co-spnd-web/src/pages/profile/
git commit -m "feat: add profile page with edit form"
```

---

## Task 16: Final build verification and cleanup

**Files:**
- Modify: `co-spnd-web/.gitignore`

- [ ] **Step 1: Ensure .gitignore excludes dist and .env**

Verify `co-spnd-web/.gitignore` contains:

```
# Logs
logs
*.log
npm-debug.log*

# Runtime data
pids
*.pid

# Dependencies
node_modules
dist
dist-ssr
*.local

# Env
.env
.env.local
.env.*.local

# Editor
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
```

If not present, update the file.

- [ ] **Step 2: Full TypeScript check**

```bash
cd co-spnd-web && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Production build**

```bash
cd co-spnd-web && npm run build
```

Expected: build completes successfully, `dist/` folder created.

- [ ] **Step 4: Final commit**

```bash
git add co-spnd-web/
git commit -m "feat: complete co-spnd-web frontend MVP"
```

---

## Summary

After completing all tasks:

**Run instructions:**
```bash
cd co-spnd-web
cp .env.example .env   # set VITE_API_URL to your backend URL
npm install
npm run dev            # http://localhost:5173
```

**Libraries used:**
- `react` + `react-dom` — UI
- `react-router-dom` — routing
- `axios` — API calls with JWT interceptors
- `tailwindcss` — styling
- `recharts` — analytics charts
- `lucide-react` — icons

**Folder structure:**
```
src/
  types/        — shared TypeScript interfaces and constants
  services/     — API layer (one file per resource)
  contexts/     — React Context (auth state)
  hooks/        — useAuth
  utils/        — date/currency formatting
  components/
    ui/         — Button, Input, Card, Modal, BottomSheet, EmptyState, LoadingSpinner, Badge
    layout/     — ProtectedRoute, AppLayout, BottomNav
  pages/
    auth/       — LoginPage, RegisterPage
    onboarding/ — OnboardingPage
    workspaces/ — WorkspacesPage, MembersPage
    transactions/ — TransactionsPage, AddTransactionSheet
    analytics/  — AnalyticsPage
    profile/    — ProfilePage
```

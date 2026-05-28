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

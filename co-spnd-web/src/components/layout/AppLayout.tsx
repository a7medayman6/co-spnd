import { Outlet, NavLink, useParams, useNavigate } from 'react-router-dom'
import { Receipt, BarChart2, Settings, User, ChevronLeft } from 'lucide-react'
import { BottomNav } from './BottomNav'
import { Logo } from '../ui/Logo'
import { NotificationBell } from '../ui/NotificationBell'

export function AppLayout() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const navigate = useNavigate()

  const navItems = workspaceId
    ? [
        { to: `/workspaces/${workspaceId}/transactions`, icon: Receipt, label: 'Expenses' },
        { to: `/workspaces/${workspaceId}/analytics`, icon: BarChart2, label: 'Analytics' },
        { to: `/workspaces/${workspaceId}/members`, icon: Settings, label: 'Settings' },
        { to: `/workspaces/${workspaceId}/profile`, icon: User, label: 'Profile' },
      ]
    : []

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col fixed inset-y-0 left-0 w-56 bg-white border-r border-[#EDE9E1] z-40">
        <div className="px-5 pt-8 pb-7 flex items-center justify-between">
          <Logo size="md" />
          <NotificationBell />
        </div>

        <nav className="flex-1 px-3 space-y-px">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#F2F0EB] text-[#0E0C0A]'
                    : 'text-[#8C8479] hover:bg-[#F9F8F5] hover:text-[#0E0C0A]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-8">
          <div className="h-px bg-[#EDE9E1] mb-3" />
          <button
            onClick={() => navigate('/workspaces', { state: { noRedirect: true } })}
            className="flex items-center gap-2 px-3 py-2.5 w-full rounded-xl text-[13px] font-semibold text-[#B5ADA4] hover:text-[#8C8479] hover:bg-[#F9F8F5] transition-all duration-150"
          >
            <ChevronLeft size={14} />
            All workspaces
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:pl-56 min-h-screen pb-24 lg:pb-0">
        {/* Mobile-only sticky top bar */}
        <div className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-[#EDE9E1] flex items-center justify-between px-5 h-14">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            <NotificationBell />
            {workspaceId && (
              <button
                onClick={() => navigate('/workspaces', { state: { noRedirect: true } })}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-[#8C8479] hover:text-[#0E0C0A] transition-colors"
              >
                <ChevronLeft size={15} strokeWidth={2.5} />
                Workspaces
              </button>
            )}
          </div>
        </div>

        <div className="max-w-lg mx-auto lg:max-w-2xl min-h-screen">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  )
}

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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 z-40 pb-safe">
      <div className="flex items-center justify-around max-w-lg mx-auto px-2 py-1.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl transition-all duration-150 min-w-[60px] ${
                isActive ? 'text-gray-950' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className="transition-all duration-150"
                />
                <span
                  className={`text-[10px] font-semibold tracking-wide transition-colors duration-150 ${
                    isActive ? 'text-gray-950' : 'text-gray-400'
                  }`}
                >
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

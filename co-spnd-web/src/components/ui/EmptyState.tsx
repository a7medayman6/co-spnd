import { type ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      {icon && (
        <div className="text-gray-200 mb-5 [&>svg]:w-12 [&>svg]:h-12">{icon}</div>
      )}
      <p className="text-[15px] font-semibold text-gray-800 tracking-tight">{title}</p>
      {description && (
        <p className="text-sm text-gray-400 mt-1.5 leading-relaxed max-w-[240px]">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

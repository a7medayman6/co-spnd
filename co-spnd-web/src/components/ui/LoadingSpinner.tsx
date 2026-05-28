interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = { sm: 'w-4 h-4 border-2', md: 'w-5 h-5 border-2', lg: 'w-7 h-7 border-[2.5px]' }

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  return (
    <div
      className={`${sizeMap[size]} border-gray-200 border-t-gray-700 rounded-full animate-spin ${className}`}
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

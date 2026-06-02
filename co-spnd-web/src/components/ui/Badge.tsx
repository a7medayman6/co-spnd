const CATEGORY_COLORS: Record<string, string> = {
  Food: 'bg-orange-50 text-orange-600 border-orange-100',
  Groceries: 'bg-lime-50 text-lime-700 border-lime-100',
  Takeaway: 'bg-amber-50 text-amber-600 border-amber-100',
  Transportation: 'bg-sky-50 text-sky-600 border-sky-100',
  Accommodation: 'bg-violet-50 text-violet-600 border-violet-100',
  Entertainment: 'bg-pink-50 text-pink-600 border-pink-100',
  Shopping: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  Health: 'bg-teal-50 text-teal-600 border-teal-100',
  Bills: 'bg-rose-50 text-rose-600 border-rose-100',
  Utilities: 'bg-blue-50 text-blue-600 border-blue-100',
  Subscriptions: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  Other: 'bg-gray-50 text-gray-500 border-gray-100',
}

interface BadgeProps {
  label: string
  colorKey?: string
  className?: string
}

export function Badge({ label, colorKey, className = '' }: BadgeProps) {
  const colorClass = colorKey
    ? (CATEGORY_COLORS[colorKey] ?? 'bg-gray-50 text-gray-500 border-gray-100')
    : 'bg-gray-50 text-gray-500 border-gray-100'
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-medium border ${colorClass} ${className}`}
    >
      {label}
    </span>
  )
}

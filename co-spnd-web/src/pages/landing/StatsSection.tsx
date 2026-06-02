import { useEffect, useState } from 'react'
import { Users, Layers, ArrowLeftRight, Coins } from 'lucide-react'
import { fetchPlatformStats, PlatformStats } from '../../services/stats.service'

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n)
}

function fmtMoney(n: number) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`bg-[#EDE9E1] rounded-lg animate-pulse ${className ?? ''}`} />
  )
}

function StatCard({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  loading: boolean
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#EDE9E1] p-6 flex flex-col gap-3">
      <div className="w-9 h-9 rounded-xl bg-[#F9F8F5] border border-[#EDE9E1] flex items-center justify-center text-[#8C8479]">
        {icon}
      </div>
      {loading ? (
        <>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-16" />
        </>
      ) : (
        <>
          <div className="font-mono text-3xl font-bold tracking-tight text-[#0E0C0A]">
            {value}
          </div>
          <p className="text-sm text-[#8C8479] font-medium">{label}</p>
        </>
      )}
    </div>
  )
}

function MoneyCard({
  stats,
  loading,
}: {
  stats: PlatformStats | null
  loading: boolean
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#EDE9E1] p-6 flex flex-col gap-3">
      <div className="w-9 h-9 rounded-xl bg-[#F9F8F5] border border-[#EDE9E1] flex items-center justify-center text-[#8C8479]">
        <Coins size={18} />
      </div>
      {loading || !stats ? (
        <>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-20" />
          <div className="mt-2 pt-3 border-t border-[#EDE9E1] flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </>
      ) : (
        <>
          <div className="font-mono text-3xl font-bold tracking-tight text-[#0E0C0A]">
            {fmtMoney(stats.totalMoney)}
          </div>
          <p className="text-sm text-[#8C8479] font-medium">Total tracked</p>
          {stats.moneyByCurrency.length > 0 && (
            <div className="mt-1 pt-3 border-t border-[#EDE9E1] flex flex-col gap-1.5">
              {stats.moneyByCurrency.map((c) => (
                <div key={c.currency} className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#B5ADA4] tracking-wider">
                    {c.currency}
                  </span>
                  <span className="font-mono text-sm font-medium text-[#0E0C0A]">
                    {fmtMoney(c.total)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function StatsSection() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlatformStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  if (!loading && !stats) return null

  return (
    <section className="max-w-5xl mx-auto px-6 py-16">
      <div className="text-center mb-10">
        <p className="text-xs font-bold uppercase tracking-widest text-[#B5ADA4] mb-2">
          By the numbers
        </p>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Real usage, live from the platform
        </h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users size={18} />}
          label="Users"
          value={stats ? fmt(stats.users) : ''}
          loading={loading}
        />
        <StatCard
          icon={<Layers size={18} />}
          label="Workspaces"
          value={stats ? fmt(stats.workspaces) : ''}
          loading={loading}
        />
        <StatCard
          icon={<ArrowLeftRight size={18} />}
          label="Transactions"
          value={stats ? fmt(stats.transactions) : ''}
          loading={loading}
        />
        <MoneyCard stats={stats} loading={loading} />
      </div>
    </section>
  )
}

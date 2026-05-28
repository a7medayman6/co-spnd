import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Star, ArrowRight, Zap, Users, BarChart3, Scale, Check } from 'lucide-react'
import { Logo } from '../../components/ui/Logo'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'
import heroImage from '../../assets/hero.png'

export function LandingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/workspaces', { replace: true })
  }, [user, navigate])

  return (
    <div className="min-h-screen bg-[#F9F8F5] text-[#0E0C0A]">

      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-[#F9F8F5]/90 backdrop-blur-sm border-b border-[#EDE9E1]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="https://github.com/a7medayman6/co-spnd"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-[#8C8479] hover:text-[#0E0C0A] transition-colors"
            >
              <Star size={14} />
              Star on GitHub
            </a>
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-12 text-center">
        <a
          href="https://github.com/a7medayman6/co-spnd"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white border border-[#EDE9E1] rounded-full px-4 py-1.5 text-sm text-[#8C8479] font-medium mb-8 shadow-sm hover:border-[#D1C9BC] transition-colors"
        >
          <Star size={13} className="text-amber-400 fill-amber-400" />
          Open source — star us on GitHub
          <ArrowRight size={13} />
        </a>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.06] mb-6">
          Shared spending,
          <br />
          <span className="text-[#8C8479]">simplified.</span>
        </h1>

        <p className="text-lg text-[#8C8479] max-w-md mx-auto leading-relaxed mb-10">
          Track expenses with friends, roommates, or travel partners — in a shared workspace with analytics that actually make sense.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/register">
            <Button size="lg" className="w-full sm:w-auto">
              Start for free <ArrowRight size={16} />
            </Button>
          </Link>
          <a
            href="https://github.com/a7medayman6/co-spnd"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              <Star size={15} /> Star on GitHub
            </Button>
          </a>
        </div>
      </section>

      {/* ── App Preview ────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="bg-white rounded-3xl border border-[#EDE9E1] shadow-2xl shadow-black/5 overflow-hidden">
          <img
            src={heroImage}
            alt="Co-Spnd app interface showing shared expenses and analytics"
            className="w-full object-cover"
          />
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section className="bg-white border-y border-[#EDE9E1]">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
              Everything you need, nothing you don't
            </h2>
            <p className="text-[#8C8479] text-base max-w-sm mx-auto">
              A focused toolkit for groups who want to track shared money without the overhead.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: <Users size={20} />,
                title: 'Shared Workspaces',
                desc: 'Create a workspace for any group — a trip, household, or team. Invite anyone by email and collaborate instantly.',
              },
              {
                icon: <Zap size={20} />,
                title: 'Lightning-fast Entry',
                desc: 'Add a transaction in two taps. Just amount and category. Description, date, and spender are all optional.',
              },
              {
                icon: <BarChart3 size={20} />,
                title: 'Smart Analytics',
                desc: 'See spending by category, by person, and over time. Trends, comparisons, and top expenses — all in one view.',
              },
              {
                icon: <Scale size={20} />,
                title: 'Custom Splits',
                desc: 'Set percentage-based splits per workspace member. Flexible and fair for every situation.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-[#F9F8F5] rounded-2xl p-6 flex gap-4 items-start border border-[#EDE9E1]"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-[#EDE9E1] flex items-center justify-center text-[#0E0C0A] flex-shrink-0 shadow-sm">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-bold text-[15px] mb-1.5">{f.title}</h3>
                  <p className="text-sm text-[#8C8479] leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Up and running in minutes
          </h2>
          <p className="text-[#8C8479] text-base max-w-xs mx-auto">
            No setup overhead. Start tracking in three steps.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Create a workspace',
              desc: 'Name it after your trip, household, or project. Invite your group with their email addresses.',
            },
            {
              step: '02',
              title: 'Log transactions',
              desc: 'Add expenses as they happen. Amount and category are all you need — we handle the rest.',
            },
            {
              step: '03',
              title: 'See the full picture',
              desc: 'Analytics show totals, trends, and who spent what — so nothing is ever a surprise at the end.',
            },
          ].map((s) => (
            <div key={s.step}>
              <div className="text-[4rem] font-extrabold text-[#EDE9E1] font-mono leading-none mb-4 select-none">
                {s.step}
              </div>
              <h3 className="font-bold text-[15px] mb-2">{s.title}</h3>
              <p className="text-sm text-[#8C8479] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why Co-Spnd ────────────────────────────────────── */}
      <section className="bg-white border-y border-[#EDE9E1]">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
                Built for the way you actually spend
              </h2>
              <p className="text-[#8C8479] leading-relaxed mb-8">
                Most finance apps assume you're tracking solo. Co-Spnd is built from the ground up for groups — trips, households, teams — where money is shared and tracking should be effortless.
              </p>
              <ul className="space-y-3">
                {[
                  'No spreadsheets or manual splits',
                  'Mobile-first, works on any device',
                  'Open source and free forever',
                  'Your data stays yours',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm font-medium">
                    <div className="w-5 h-5 rounded-full bg-[#F9F8F5] border border-[#EDE9E1] flex items-center justify-center flex-shrink-0">
                      <Check size={11} strokeWidth={2.5} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Mini transaction list mockup */}
            <div className="bg-[#F9F8F5] rounded-3xl border border-[#EDE9E1] p-6">
              <p className="text-xs font-semibold text-[#B5ADA4] uppercase tracking-widest mb-4">
                Trip to Lisbon · May 2026
              </p>
              <div className="space-y-2.5">
                {[
                  { category: 'Food', desc: 'Dinner at Tasca do Chico', amount: '€42.00', who: 'Ahmed' },
                  { category: 'Transport', desc: 'Metro day cards', amount: '€12.50', who: 'Sara' },
                  { category: 'Accommodation', desc: 'Airbnb — night 2', amount: '€110.00', who: 'Ahmed' },
                  { category: 'Food', desc: 'Pastéis de Belém', amount: '€8.80', who: 'Mona' },
                ].map((tx) => (
                  <div
                    key={tx.desc}
                    className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between border border-[#EDE9E1]"
                  >
                    <div>
                      <p className="text-[13px] font-semibold">{tx.desc}</p>
                      <p className="text-[11px] text-[#B5ADA4] mt-0.5">
                        {tx.category} · {tx.who}
                      </p>
                    </div>
                    <span className="font-mono font-medium text-sm text-[#0E0C0A]">{tx.amount}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-[#EDE9E1] flex justify-between items-center">
                <span className="text-xs text-[#B5ADA4] font-medium">4 transactions</span>
                <span className="font-mono font-bold text-base">€173.30</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
          Ready to track smarter?
        </h2>
        <p className="text-[#8C8479] text-base max-w-xs mx-auto mb-10">
          Free, open-source, and built for real groups.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/register">
            <Button size="lg">
              Create a free account <ArrowRight size={16} />
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary" size="lg">
              Sign in
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-[#EDE9E1] py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <div className="flex items-center gap-6 text-sm text-[#B5ADA4]">
            <a
              href="https://github.com/a7medayman6/co-spnd"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#8C8479] transition-colors flex items-center gap-1.5"
            >
              <Star size={13} /> GitHub
            </a>
            <Link to="/login" className="hover:text-[#8C8479] transition-colors">
              Sign in
            </Link>
            <Link to="/register" className="hover:text-[#8C8479] transition-colors">
              Sign up
            </Link>
          </div>
          <p className="text-[#B5ADA4] text-xs">© 2026 Co-Spnd</p>
        </div>
      </footer>
    </div>
  )
}

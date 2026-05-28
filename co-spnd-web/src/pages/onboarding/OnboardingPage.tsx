import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Zap, BarChart2, ArrowRight } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Logo } from '../../components/ui/Logo'

const SLIDES = [
  {
    icon: Users,
    title: 'Shared spaces,\nzero confusion',
    description:
      'Create a workspace with anyone — trips, households, events. Keep finances in one place.',
    bg: 'bg-sky-50',
    iconColor: 'text-sky-500',
    dot: 'bg-sky-400',
  },
  {
    icon: Zap,
    title: 'Log in\nseconds',
    description:
      "Amount and category. That's it. Everything else is optional and stays out of your way.",
    bg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    dot: 'bg-amber-400',
  },
  {
    icon: BarChart2,
    title: 'See who spent\nwhat and where',
    description:
      'Clean analytics by category and person. Know exactly where the money went.',
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    dot: 'bg-emerald-400',
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
    <div className="min-h-screen bg-surface flex flex-col select-none">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-12 lg:pt-10">
        <Logo size="sm" />
        <button
          onClick={handleSkip}
          className="text-[13px] font-semibold text-[#B5ADA4] hover:text-[#8C8479] transition-colors tracking-wide"
        >
          Skip
        </button>
      </div>

      {/* Slide */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-4">
        {/* Icon tile */}
        <div
          className={`w-28 h-28 lg:w-36 lg:h-36 rounded-[2rem] ${slide.bg} flex items-center justify-center mb-10 transition-all duration-300`}
        >
          <Icon size={52} className={slide.iconColor} strokeWidth={1.5} />
        </div>

        {/* Text */}
        <h1 className="text-[2rem] lg:text-[2.4rem] font-extrabold text-[#0E0C0A] text-center leading-tight whitespace-pre-line tracking-tight max-w-xs lg:max-w-sm">
          {slide.title}
        </h1>
        <p className="text-[#8C8479] text-[15px] text-center mt-4 leading-relaxed max-w-[280px]">
          {slide.description}
        </p>
      </div>

      {/* Navigation */}
      <div className="px-6 pb-12 max-w-sm mx-auto w-full">
        {/* Progress dots */}
        <div className="flex justify-center items-center gap-2 mb-8">
          {SLIDES.map((s, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current ? `w-6 ${s.dot}` : 'w-2 bg-gray-200'
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
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  )
}

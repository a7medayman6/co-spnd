import { Link } from 'react-router-dom'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showWordmark?: boolean
  className?: string
}

export function Logo({ size = 'md', showWordmark = true, className = '' }: LogoProps) {
  const markW = { sm: 28, md: 36, lg: 48 }[size]
  const markH = { sm: 18, md: 22, lg: 30 }[size]
  const textClass = { sm: 'text-[15px]', md: 'text-[18px]', lg: 'text-[24px]' }[size]

  return (
    <Link
      to="/"
      aria-label="Go to home page"
      className={`flex items-center gap-2.5 select-none rounded-lg outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#0E0C0A]/20 ${className}`}
    >
      <svg
        width={markW}
        height={markH}
        viewBox="0 0 44 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="14" cy="14" r="12" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="30" cy="14" r="12" stroke="currentColor" strokeWidth="2.5" />
        <path
          d="M22 4.2a12 12 0 0 1 0 19.6A12 12 0 0 1 22 4.2z"
          fill="currentColor"
          opacity="0.12"
        />
      </svg>
      {showWordmark && (
        <span className={`font-extrabold tracking-tight leading-none text-[#0E0C0A] ${textClass}`}>
          Co-Spnd
        </span>
      )}
    </Link>
  )
}

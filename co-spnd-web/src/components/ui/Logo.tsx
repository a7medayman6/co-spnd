interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showWordmark?: boolean
  className?: string
}

export function Logo({ size = 'md', showWordmark = true, className = '' }: LogoProps) {
  const markSize = { sm: 24, md: 32, lg: 44 }[size]
  const textClass = { sm: 'text-[15px]', md: 'text-[18px]', lg: 'text-[24px]' }[size]

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <img
        src="/favicon.svg"
        width={markSize}
        height={markSize}
        alt="Co-Spnd"
        aria-hidden={showWordmark}
      />
      {showWordmark && (
        <span className={`font-extrabold tracking-tight leading-none text-[#0E0C0A] ${textClass}`}>
          Co-Spnd
        </span>
      )}
    </div>
  )
}

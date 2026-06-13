'use client'

interface LogoProps {
  height?: number
  showSubtitle?: boolean
  variant?: 'dark' | 'light'
}

export function RakshaLogo({ height = 36, showSubtitle = false, variant = 'dark' }: LogoProps) {
  const shieldHeight = height
  const shieldWidth = (40 / 47) * shieldHeight
  
  const rakshaColor = variant === 'dark' ? '#FAF9F7' : '#9B2335'
  
  return (
    <div className="flex items-center gap-2">
      <svg 
        viewBox="0 0 48 56" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        width={shieldWidth} 
        height={shieldHeight}
        className="shrink-0"
      >
        <path d="M24 2L44 11V30C44 43 24 54 24 54C24 54 4 43 4 30V11L24 2Z" fill="#8B1A2A"/>
        <path 
          d="M24 14C24 14 17 22.5 17 27C17 30.87 20.13 34 24 34C27.87 34 31 30.87 31 27C31 22.5 24 14 24 14Z" 
          fill="white" 
          opacity="0.95"
        />
        <path 
          d="M16 39Q20 36 24 39Q28 42 32 39" 
          stroke="#2CA8A0" 
          strokeWidth="1.8" 
          strokeLinecap="round" 
          fill="none"
        />
        <path 
          d="M18 44Q21 41.5 24 44Q27 46.5 30 44" 
          stroke="#E8897A" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          fill="none"
        />
      </svg>
      <div className="flex flex-col">
        <div className="flex items-baseline">
          <span 
            className="font-display font-semibold tracking-tight"
            style={{ 
              fontSize: height * 0.6,
              color: rakshaColor,
              lineHeight: 1
            }}
          >
            Raksha
          </span>
          <span 
            className="font-display font-semibold tracking-tight"
            style={{ 
              fontSize: height * 0.6,
              color: '#2CA8A0',
              lineHeight: 1
            }}
          >
            AI
          </span>
        </div>
        {showSubtitle && (
          <span 
            className="text-raksha-muted uppercase tracking-widest"
            style={{ fontSize: height * 0.22 }}
          >
            Blood Intelligence & Care Coordination
          </span>
        )}
      </div>
    </div>
  )
}

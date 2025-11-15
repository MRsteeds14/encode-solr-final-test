interface GlowOrbProps {
  size?: number
  color?: 'primary' | 'secondary' | 'accent'
  className?: string
}

export function GlowOrb({ size = 200, color = 'primary', className = '' }: GlowOrbProps) {
  const colors = {
    primary: 'from-primary/40 via-primary/20 to-transparent',
    secondary: 'from-secondary/40 via-secondary/20 to-transparent',
    accent: 'from-accent/40 via-accent/20 to-transparent',
  }

  const glowColors = {
    primary: 'shadow-primary/50',
    secondary: 'shadow-secondary/50',
    accent: 'shadow-accent/50',
  }

  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      <div
        className={`absolute inset-0 rounded-full bg-gradient-radial ${colors[color]} blur-xl md:blur-2xl animate-glow`}
      />
      <div
        className={`absolute inset-2 md:inset-4 rounded-full bg-gradient-radial ${colors[color]} blur-lg md:blur-xl`}
      />
      <div
        className={`absolute inset-4 md:inset-8 rounded-full bg-gradient-radial ${colors[color]} shadow-xl md:shadow-2xl ${glowColors[color]}`}
      />
    </div>
  )
}

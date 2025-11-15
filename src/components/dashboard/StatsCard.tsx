import { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'

interface StatsCardProps {
  title: string
  value: string
  subtitle?: string
  icon: ReactNode
  trend?: {
    value: string
    positive: boolean
  }
  glowColor?: 'primary' | 'secondary' | 'accent'
}

export function StatsCard({ title, value, subtitle, icon, trend, glowColor = 'primary' }: StatsCardProps) {
  const glowClasses = {
    primary: 'hover:shadow-primary/20',
    secondary: 'hover:shadow-secondary/20',
    accent: 'hover:shadow-accent/20',
  }

  const iconGlow = {
    primary: 'text-primary drop-shadow-[0_0_8px_oklch(0.65_0.25_265)] md:drop-shadow-[0_0_12px_oklch(0.65_0.25_265)]',
    secondary: 'text-secondary drop-shadow-[0_0_8px_oklch(0.55_0.20_210)] md:drop-shadow-[0_0_12px_oklch(0.55_0.20_210)]',
    accent: 'text-accent drop-shadow-[0_0_8px_oklch(0.70_0.18_330)] md:drop-shadow-[0_0_12px_oklch(0.70_0.18_330)]',
  }

  return (
    <Card className={`glass-card p-4 md:p-6 hover:shadow-2xl transition-all duration-300 border-border/50 ${glowClasses[glowColor]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs md:text-sm font-medium text-muted-foreground mb-1 md:mb-2">{title}</p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h3 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight mb-1 text-[oklch(0.85_0.25_145)] break-words">{value}</h3>
          </motion.div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <div className={`text-xs font-medium mt-2 ${trend.positive ? 'text-primary' : 'text-destructive'}`}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </div>
          )}
        </div>
        <div className={`flex-shrink-0 ${iconGlow[glowColor]} [&>*]:w-6 [&>*]:h-6 md:[&>*]:w-7 md:[&>*]:h-7 lg:[&>*]:w-8 lg:[&>*]:h-8`}>
          {icon}
        </div>
      </div>
    </Card>
  )
}

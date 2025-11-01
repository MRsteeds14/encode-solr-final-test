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
}

export function StatsCard({ title, value, subtitle, icon, trend }: StatsCardProps) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h3 className="text-3xl font-bold tracking-tight mb-1">{value}</h3>
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
        <div className="ml-4 text-muted-foreground">
          {icon}
        </div>
      </div>
    </Card>
  )
}

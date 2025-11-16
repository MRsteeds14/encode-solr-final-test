import { Card } from '@/components/ui/card'

export function LoadingCard() {
  return (
    <Card className="glass-card p-4 md:p-6 border-border/50">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-muted/30 rounded w-24 animate-pulse"></div>
          <div className="h-8 bg-muted/30 rounded w-32 animate-pulse"></div>
          <div className="h-3 bg-muted/30 rounded w-20 animate-pulse"></div>
        </div>
        <div className="w-8 h-8 bg-muted/30 rounded animate-pulse flex-shrink-0"></div>
      </div>
    </Card>
  )
}

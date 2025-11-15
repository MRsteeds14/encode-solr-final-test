import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Robot, ShieldCheck, CheckCircle, XCircle, Spinner } from '@phosphor-icons/react'
import { AgentStatus as AgentStatusType } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'

interface AgentStatusProps {
  agents: AgentStatusType[]
  progress: number
}

export function AgentStatus({ agents, progress }: AgentStatusProps) {
  const getStatusIcon = (status: AgentStatusType['status']) => {
    switch (status) {
      case 'processing':
        return <Spinner size={16} className="md:w-5 md:h-5 animate-spin text-primary" />
      case 'completed':
        return <CheckCircle size={16} weight="fill" className="md:w-5 md:h-5 text-primary drop-shadow-[0_0_8px_oklch(0.65_0.25_265)]" />
      case 'error':
        return <XCircle size={16} weight="fill" className="md:w-5 md:h-5 text-destructive" />
      default:
        return <div className="w-4 h-4 md:w-5 md:h-5 rounded-full border-2 border-muted" />
    }
  }

  const getAgentIcon = (name: string) => {
    if (name.includes('Risk')) {
      return <ShieldCheck size={20} weight="fill" className="md:w-6 md:h-6" />
    }
    return <Robot size={20} weight="fill" className="md:w-6 md:h-6" />
  }

  return (
    <Card className="glass-card p-4 md:p-6 border-border/50">
      <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">AI Agent Processing</h3>
      
      <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
        <AnimatePresence mode="wait">
          {agents.map((agent, index) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2 }}
              className={`relative flex items-start gap-2 md:gap-3 p-3 md:p-4 rounded-lg transition-all ${
                agent.status === 'processing' 
                  ? 'bg-primary/10 border border-primary/30 shadow-[0_0_20px_oklch(0.65_0.25_265/0.2)]' 
                  : agent.status === 'completed'
                  ? 'bg-primary/5 border border-primary/20'
                  : 'bg-background/30 border border-border/50'
              }`}
            >
              {agent.status === 'processing' && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-transparent rounded-lg animate-pulse"></div>
              )}
              <div className={`relative p-1.5 md:p-2 rounded-lg flex-shrink-0 ${
                agent.status === 'processing' 
                  ? 'bg-primary/20 text-primary border border-primary/30' 
                  : agent.status === 'completed'
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {getAgentIcon(agent.name)}
              </div>
              <div className="relative flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1 gap-2">
                  <h4 className="font-semibold text-sm md:text-base truncate">{agent.name}</h4>
                  <div className="flex-shrink-0">{getStatusIcon(agent.status)}</div>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground">{agent.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {progress > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs md:text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold text-primary">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
    </Card>
  )
}

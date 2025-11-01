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
        return <Spinner size={20} className="animate-spin" />
      case 'completed':
        return <CheckCircle size={20} weight="fill" className="text-primary" />
      case 'error':
        return <XCircle size={20} weight="fill" className="text-destructive" />
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-muted" />
    }
  }

  const getAgentIcon = (name: string) => {
    if (name.includes('Risk')) {
      return <ShieldCheck size={24} weight="fill" />
    }
    return <Robot size={24} weight="fill" />
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">AI Agent Processing</h3>
      
      <div className="space-y-4 mb-6">
        <AnimatePresence mode="wait">
          {agents.map((agent, index) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2 }}
              className={`flex items-start gap-3 p-4 rounded-lg transition-colors ${
                agent.status === 'processing' 
                  ? 'bg-primary/10 border border-primary/20' 
                  : agent.status === 'completed'
                  ? 'bg-primary/5'
                  : 'bg-muted/50'
              }`}
            >
              <div className={`p-2 rounded-lg ${
                agent.status === 'processing' 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {getAgentIcon(agent.name)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold">{agent.name}</h4>
                  {getStatusIcon(agent.status)}
                </div>
                <p className="text-sm text-muted-foreground">{agent.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {progress > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
    </Card>
  )
}

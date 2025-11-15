import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowsLeftRight, Lightning, Copy, FileText } from '@phosphor-icons/react'
import { Transaction } from '@/types'
import { formatDate, formatNumber, shortenAddress } from '@/lib/helpers'
import { toast } from 'sonner'
import { useState } from 'react'

interface TransactionFeedProps {
  transactions: Transaction[]
}

export function TransactionFeed({ transactions }: TransactionFeedProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  if (transactions.length === 0) {
    return (
      <Card className="glass-card p-4 md:p-6 border-border/50">
        <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Recent Activity</h3>
        <div className="text-center py-6 md:py-8 text-muted-foreground">
          <Lightning size={window.innerWidth < 640 ? 36 : 48} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No transactions yet</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="glass-card p-4 md:p-6 border-border/50">
      <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Recent Activity</h3>
      <div className="space-y-2 md:space-y-3">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="border border-border/50 bg-background/30 rounded-lg p-3 md:p-4 hover:bg-background/50 hover:border-primary/30 transition-all cursor-pointer backdrop-blur-sm"
            onClick={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 md:gap-3 flex-1 min-w-0">
                <div className={`relative p-1.5 md:p-2 rounded-lg flex-shrink-0 ${tx.type === 'mint' ? 'bg-primary/10 border border-primary/30' : 'bg-accent/10 border border-accent/30'}`}>
                  {tx.type === 'mint' ? (
                    <Lightning size={16} weight="fill" className="md:w-5 md:h-5 text-primary drop-shadow-[0_0_8px_oklch(0.65_0.25_265)]" />
                  ) : (
                    <ArrowsLeftRight size={16} weight="fill" className="md:w-5 md:h-5 text-accent drop-shadow-[0_0_8px_oklch(0.70_0.18_330)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold capitalize text-sm md:text-base">{tx.type}</span>
                    <Badge variant={tx.status === 'confirmed' ? 'default' : 'secondary'} className="bg-[oklch(0.85_0.25_145)]/20 text-[oklch(0.85_0.25_145)] border-[oklch(0.85_0.25_145)]/30 text-xs">
                      {tx.status}
                    </Badge>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">
                    {tx.type === 'mint' 
                      ? `+${formatNumber(tx.amount)} sARC` 
                      : `-${formatNumber(tx.amount)} sARC → +${formatNumber(tx.usdcAmount || 0)} USDC`
                    }
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(tx.timestamp)}
                  </p>
                </div>
              </div>
            </div>

            {expandedId === tx.id && (
              <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-border/30 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground flex-shrink-0">Tx Hash</span>
                  <div className="flex items-center gap-1 md:gap-2 min-w-0">
                    <span className="font-mono text-xs truncate">{shortenAddress(tx.txHash)}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 md:h-7 md:w-7 p-0 hover:bg-primary/20 hover:text-primary flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(tx.txHash, 'Transaction hash')
                      }}
                    >
                      <Copy size={12} className="md:w-3.5 md:h-3.5" />
                    </Button>
                  </div>
                </div>
                {tx.ipfsHash && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground flex-shrink-0">IPFS</span>
                    <div className="flex items-center gap-1 md:gap-2 min-w-0">
                      <span className="font-mono text-xs truncate">{tx.ipfsHash.slice(0, 12)}...</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 md:h-7 md:w-7 p-0 hover:bg-secondary/20 hover:text-secondary flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          copyToClipboard(`https://ipfs.io/ipfs/${tx.ipfsHash}`, 'IPFS link')
                        }}
                      >
                        <FileText size={12} className="md:w-3.5 md:h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

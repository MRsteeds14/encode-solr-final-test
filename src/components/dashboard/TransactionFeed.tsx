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
      <Card className="glass-card p-6 border-border/50">
        <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Recent Activity</h3>
        <div className="text-center py-8 text-muted-foreground">
          <Lightning size={48} className="mx-auto mb-2 opacity-50" />
          <p>No transactions yet</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="glass-card p-6 border-border/50">
      <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Recent Activity</h3>
      <div className="space-y-3">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="border border-border/50 bg-background/30 rounded-lg p-4 hover:bg-background/50 hover:border-primary/30 transition-all cursor-pointer backdrop-blur-sm"
            onClick={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className={`relative p-2 rounded-lg ${tx.type === 'mint' ? 'bg-primary/10 border border-primary/30' : 'bg-accent/10 border border-accent/30'}`}>
                  {tx.type === 'mint' ? (
                    <Lightning size={20} weight="fill" className="text-primary drop-shadow-[0_0_8px_oklch(0.65_0.25_265)]" />
                  ) : (
                    <ArrowsLeftRight size={20} weight="fill" className="text-accent drop-shadow-[0_0_8px_oklch(0.70_0.18_330)]" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold capitalize">{tx.type}</span>
                    <Badge variant={tx.status === 'confirmed' ? 'default' : 'secondary'} className="bg-[oklch(0.85_0.25_145)]/20 text-[oklch(0.85_0.25_145)] border-[oklch(0.85_0.25_145)]/30">
                      {tx.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
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
              <div className="mt-4 pt-4 border-t border-border/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Transaction Hash</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">{shortenAddress(tx.txHash)}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 hover:bg-primary/20 hover:text-primary"
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(tx.txHash, 'Transaction hash')
                      }}
                    >
                      <Copy size={14} />
                    </Button>
                  </div>
                </div>
                {tx.ipfsHash && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">IPFS Proof</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{tx.ipfsHash.slice(0, 12)}...</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 hover:bg-secondary/20 hover:text-secondary"
                        onClick={(e) => {
                          e.stopPropagation()
                          copyToClipboard(`https://ipfs.io/ipfs/${tx.ipfsHash}`, 'IPFS link')
                        }}
                      >
                        <FileText size={14} />
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

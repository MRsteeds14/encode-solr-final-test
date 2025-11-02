import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowsLeftRight, CurrencyCircleDollar } from '@phosphor-icons/react'
import { EXCHANGE_RATE } from '@/lib/constants'
import { formatNumber, formatCurrency } from '@/lib/helpers'
import { toast } from 'sonner'

interface RedemptionFormProps {
  balance: number
  onRedeem: (amount: number) => Promise<void>
}

export function RedemptionForm({ balance, onRedeem }: RedemptionFormProps) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const sarcAmount = parseFloat(amount) || 0
  const usdcAmount = sarcAmount * EXCHANGE_RATE

  const isValid = sarcAmount > 0 && sarcAmount <= balance

  const handleRedeem = async () => {
    if (!isValid) {
      toast.error('Please enter a valid amount')
      return
    }

    setLoading(true)
    try {
      await onRedeem(sarcAmount)
      setAmount('')
      toast.success(`Successfully redeemed ${formatNumber(sarcAmount)} sARC for ${formatCurrency(usdcAmount)}!`)
    } catch (error) {
      toast.error('Failed to redeem tokens')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="glass-card p-6 border-border/50">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <div className="absolute inset-0 bg-accent/30 blur-lg rounded-lg"></div>
          <div className="relative p-3 bg-accent/10 rounded-lg border border-accent/30">
            <CurrencyCircleDollar size={24} weight="fill" className="text-accent drop-shadow-[0_0_10px_oklch(0.70_0.18_330)]" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold">Redeem sARC for USDC</h3>
          <p className="text-sm text-muted-foreground">Convert your tokens to stablecoin</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Your Balance</span>
            <span className="text-lg font-bold text-primary">{formatNumber(balance)} sARC</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Current Rate</span>
            <span className="text-sm font-semibold">1 sARC = ${EXCHANGE_RATE} USDC</span>
          </div>
        </div>

        <div>
          <Label htmlFor="sarc-input">Amount to Redeem (sARC)</Label>
          <div className="relative mt-2">
            <Input
              id="sarc-input"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              disabled={loading || balance === 0}
              className="bg-background/50 border-border/50 focus:border-accent focus:ring-accent"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 text-accent hover:text-accent/80"
              onClick={() => setAmount(balance.toString())}
              disabled={loading || balance === 0}
            >
              MAX
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center py-2">
          <ArrowsLeftRight size={24} className="text-muted-foreground animate-pulse" weight="bold" />
        </div>

        <div className="bg-accent/10 border-2 border-accent/30 rounded-lg p-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent"></div>
          <div className="relative">
            <div className="text-sm text-muted-foreground mb-1">You will receive</div>
            <div className="text-3xl font-bold text-accent drop-shadow-[0_0_10px_oklch(0.70_0.18_330)]">
              {formatCurrency(usdcAmount)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">USDC on Arc Testnet</div>
          </div>
        </div>

        <Button
          onClick={handleRedeem}
          disabled={!isValid || loading || balance === 0}
          className="w-full bg-accent hover:bg-accent/90 relative overflow-hidden group"
          size="lg"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-accent via-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity"></span>
          <span className="relative flex items-center justify-center">
            {loading ? (
              <>Processing...</>
            ) : balance === 0 ? (
              <>No Balance Available</>
            ) : (
              <>
                <CurrencyCircleDollar size={20} weight="fill" className="mr-2" />
                Redeem for USDC
              </>
            )}
          </span>
        </Button>

        {balance === 0 && (
          <p className="text-xs text-center text-muted-foreground">
            Mint some sARC tokens first to redeem them for USDC
          </p>
        )}
      </div>
    </Card>
  )
}

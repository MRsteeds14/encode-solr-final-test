import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lightning, Warning } from '@phosphor-icons/react'
import { MAX_DAILY_KWH } from '@/lib/constants'
import { toast } from 'sonner'

interface EnergyInputProps {
  onSubmit: (kwh: number) => Promise<void>
  dailyUsed: number
}

export function EnergyInput({ onSubmit, dailyUsed }: EnergyInputProps) {
  const [kwh, setKwh] = useState('')
  const [loading, setLoading] = useState(false)

  const remaining = MAX_DAILY_KWH - dailyUsed
  const inputValue = parseFloat(kwh) || 0

  const isValid = inputValue > 0 && inputValue <= remaining

  const handleSubmit = async () => {
    if (!isValid) {
      toast.error('Please enter a valid kWh amount')
      return
    }

    setLoading(true)
    try {
      await onSubmit(inputValue)
      setKwh('')
      toast.success(`Successfully minted ${inputValue} sARC tokens!`)
    } catch (error) {
      toast.error('Failed to mint tokens')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="glass-card p-4 md:p-6 border-border/50">
      <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 bg-primary/30 blur-lg rounded-lg"></div>
          <div className="relative p-2 md:p-3 bg-primary/10 rounded-lg border border-primary/30">
            <Lightning size={20} weight="fill" className="md:w-6 md:h-6 text-primary drop-shadow-[0_0_10px_oklch(0.65_0.25_265)]" />
          </div>
        </div>
        <div className="min-w-0">
          <h3 className="text-base md:text-lg font-semibold truncate">Submit Energy Generation</h3>
          <p className="text-xs md:text-sm text-muted-foreground">Convert solar to sARC tokens</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="kwh-input" className="text-sm">Energy Generated (kWh)</Label>
          <Input
            id="kwh-input"
            type="number"
            value={kwh}
            onChange={(e) => setKwh(e.target.value)}
            placeholder="Enter kWh amount"
            min="0"
            step="0.01"
            disabled={loading}
            className="mt-2 bg-background/50 border-border/50 focus:border-primary focus:ring-primary text-base"
          />
          <div className="flex items-center justify-between mt-2 text-xs gap-2">
            <span className="text-muted-foreground truncate">
              Daily remaining: {remaining.toFixed(2)} kWh
            </span>
            {inputValue > remaining && (
              <span className="text-destructive flex items-center gap-1 flex-shrink-0">
                <Warning size={12} weight="fill" className="md:w-3.5 md:h-3.5" />
                <span className="hidden sm:inline">Exceeds limit</span>
                <span className="sm:hidden">Limit</span>
              </span>
            )}
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 md:p-4 space-y-2">
          <div className="flex justify-between text-xs md:text-sm">
            <span className="text-muted-foreground">You will receive:</span>
            <span className="font-semibold text-primary">{inputValue.toFixed(2)} sARC</span>
          </div>
          <div className="flex justify-between text-xs md:text-sm">
            <span className="text-muted-foreground">Estimated value:</span>
            <span className="font-semibold text-accent">${(inputValue * 0.10).toFixed(2)} USDC</span>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!isValid || loading}
          className="w-full bg-primary hover:bg-primary/90 relative overflow-hidden group text-sm md:text-base"
          size="lg"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary opacity-0 group-hover:opacity-100 transition-opacity"></span>
          <span className="relative flex items-center justify-center">
            {loading ? (
              <>Processing...</>
            ) : (
              <>
                <Lightning size={18} weight="fill" className="mr-2 md:w-5 md:h-5" />
                Mint sARC Tokens
              </>
            )}
          </span>
        </Button>
      </div>
    </Card>
  )
}

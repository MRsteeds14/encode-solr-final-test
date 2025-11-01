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
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Lightning size={24} weight="fill" className="text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Submit Energy Generation</h3>
          <p className="text-sm text-muted-foreground">Convert your solar energy to sARC tokens</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="kwh-input">Energy Generated (kWh)</Label>
          <Input
            id="kwh-input"
            type="number"
            value={kwh}
            onChange={(e) => setKwh(e.target.value)}
            placeholder="Enter kWh amount"
            min="0"
            step="0.01"
            disabled={loading}
            className="mt-2"
          />
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-muted-foreground">
              Daily remaining: {remaining.toFixed(2)} kWh
            </span>
            {inputValue > remaining && (
              <span className="text-destructive flex items-center gap-1">
                <Warning size={14} weight="fill" />
                Exceeds daily limit
              </span>
            )}
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">You will receive:</span>
            <span className="font-semibold">{inputValue.toFixed(2)} sARC</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Estimated value:</span>
            <span className="font-semibold text-accent">${(inputValue * 0.10).toFixed(2)} USDC</span>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!isValid || loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>Processing...</>
          ) : (
            <>
              <Lightning size={20} weight="fill" className="mr-2" />
              Mint sARC Tokens
            </>
          )}
        </Button>
      </div>
    </Card>
  )
}

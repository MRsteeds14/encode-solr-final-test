import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Wallet, CheckCircle } from '@phosphor-icons/react'
import { shortenAddress } from '@/lib/helpers'
import { DEMO_WALLET_ADDRESS, ARC_TESTNET } from '@/lib/constants'
import { WalletState } from '@/types'

interface WalletButtonProps {
  wallet: WalletState
  onConnect: () => void
  onDisconnect: () => void
}

export function WalletButton({ wallet, onConnect, onDisconnect }: WalletButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!wallet.connected) {
    return (
      <Button
        onClick={onConnect}
        size="lg"
        className="gap-2"
      >
        <Wallet size={20} weight="fill" />
        Connect Wallet
      </Button>
    )
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="lg"
        className="gap-2 font-mono"
      >
        <CheckCircle size={20} weight="fill" className="text-primary" />
        {shortenAddress(wallet.address || '')}
        <Badge variant="secondary" className="ml-1">
          {wallet.network}
        </Badge>
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-lg p-4 shadow-lg z-50">
          <div className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Address</div>
              <div className="font-mono text-sm">{shortenAddress(wallet.address || '')}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Network</div>
              <div className="text-sm">{ARC_TESTNET.name}</div>
            </div>
            <Button
              onClick={() => {
                onDisconnect()
                setIsOpen(false)
              }}
              variant="destructive"
              size="sm"
              className="w-full"
            >
              Disconnect
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

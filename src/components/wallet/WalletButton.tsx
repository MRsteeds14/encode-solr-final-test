import { useState, useEffect, useRef } from 'react'
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
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

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
    <div className="relative w-full sm:w-auto" ref={dropdownRef}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        size="default"
        className="gap-1.5 sm:gap-2 font-mono text-xs sm:text-sm w-full sm:w-auto justify-between sm:justify-center bg-black/60 text-[oklch(0.85_0.25_140)] border-[oklch(0.85_0.25_140)]/30 hover:bg-black/70 hover:text-[oklch(0.90_0.25_140)] hover:border-[oklch(0.85_0.25_140)]/50"
      >
        <CheckCircle size={18} weight="fill" className="text-[oklch(0.85_0.25_140)] flex-shrink-0" />
        <span className="truncate">{shortenAddress(wallet.address || '')}</span>
        <Badge variant="secondary" className="ml-1 hidden xs:inline-flex bg-black/40 text-[oklch(0.85_0.25_140)] border-[oklch(0.85_0.25_140)]/20">
          {wallet.network}
        </Badge>
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-full sm:w-64 bg-card border border-border rounded-lg p-4 shadow-lg z-50">
          <div className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Address</div>
              <div className="font-mono text-sm break-all">{wallet.address}</div>
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

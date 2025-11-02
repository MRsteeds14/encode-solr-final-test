import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Toaster, toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Sun, Lightning, ChartLine, ArrowsLeftRight, UserCircle, Coins, CurrencyCircleDollar } from '@phosphor-icons/react'
import solrarcLogo from '@/assets/images/SOLRARC.JPG'

import { WalletButton } from '@/components/wallet/WalletButton'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { EnergyChart } from '@/components/dashboard/EnergyChart'
import { TransactionFeed } from '@/components/dashboard/TransactionFeed'
import { Hero3D } from '@/components/dashboard/Hero3D'
import { GlowOrb } from '@/components/dashboard/GlowOrb'
import { EnergyInput } from '@/components/minting/EnergyInput'
import { AgentStatus } from '@/components/minting/AgentStatus'
import { RedemptionForm } from '@/components/redemption/RedemptionForm'

import { Transaction, WalletState, ProducerProfile, EnergyData, AgentStatus as AgentStatusType, TokenBalance } from '@/types'
import { DEMO_WALLET_ADDRESS, ARC_TESTNET, EXCHANGE_RATE } from '@/lib/constants'
import { generateTxHash, generateIpfsHash, formatNumber, formatCurrency, generateEnergyData } from '@/lib/helpers'

function App() {
  const [wallet, setWallet] = useKV<WalletState>('wallet', {
    connected: false,
    address: null,
    network: ARC_TESTNET.name,
  })

  const [balance, setBalance] = useKV<TokenBalance>('balance', {
    sarc: 0,
    usdc: 0,
  })

  const [transactions, setTransactions] = useKV<Transaction[]>('transactions', [])
  
  const [profile, setProfile] = useKV<ProducerProfile>('profile', {
    address: DEMO_WALLET_ADDRESS,
    systemCapacity: 10,
    dailyCap: 100,
    totalGenerated: 0,
    totalEarned: 0,
    joinedDate: Date.now(),
  })

  const [energyData, setEnergyData] = useKV<EnergyData[]>('energyData', generateEnergyData(30))

  const [activeTab, setActiveTab] = useState('overview')
  const [minting, setMinting] = useState(false)
  const [agents, setAgents] = useState<AgentStatusType[]>([])
  const [progress, setProgress] = useState(0)

  const dailyUsed = (transactions || [])
    .filter(tx => {
      const today = new Date().toDateString()
      return new Date(tx.timestamp).toDateString() === today && tx.type === 'mint'
    })
    .reduce((sum, tx) => sum + tx.amount, 0)

  const handleConnect = () => {
    const address = DEMO_WALLET_ADDRESS
    setWallet({
      connected: true,
      address,
      network: ARC_TESTNET.name,
    })
    toast.success('Wallet connected successfully!')
  }

  const handleDisconnect = () => {
    setWallet({
      connected: false,
      address: null,
      network: ARC_TESTNET.name,
    })
    toast.info('Wallet disconnected')
  }

  const simulateAgentProcessing = async (kwh: number): Promise<{ txHash: string; ipfsHash: string }> => {
    setMinting(true)
    setProgress(0)

    const agentSteps: AgentStatusType[] = [
      { name: 'Risk & Policy Agent', status: 'idle', message: 'Waiting to validate...' },
      { name: 'Proof-of-Generation Agent', status: 'idle', message: 'Waiting to process...' },
    ]

    setAgents(agentSteps)

    await new Promise(resolve => setTimeout(resolve, 500))

    setAgents(current => [
      { ...current[0], status: 'processing', message: 'Validating producer whitelist and daily limits...' },
      current[1],
    ])
    setProgress(25)

    await new Promise(resolve => setTimeout(resolve, 1500))

    setAgents(current => [
      { ...current[0], status: 'completed', message: 'Validation passed ✓' },
      current[1],
    ])
    setProgress(50)

    await new Promise(resolve => setTimeout(resolve, 500))

    setAgents(current => [
      current[0],
      { ...current[1], status: 'processing', message: 'Generating IPFS proof and minting tokens...' },
    ])
    setProgress(75)

    await new Promise(resolve => setTimeout(resolve, 2000))

    const txHash = generateTxHash()
    const ipfsHash = generateIpfsHash()

    setAgents(current => [
      current[0],
      { ...current[1], status: 'completed', message: `Minted ${kwh} sARC tokens ✓` },
    ])
    setProgress(100)

    await new Promise(resolve => setTimeout(resolve, 500))

    setMinting(false)

    return { txHash, ipfsHash }
  }

  const handleMint = async (kwh: number) => {
    if (!wallet?.connected) {
      toast.error('Please connect your wallet first')
      return
    }

    const { txHash, ipfsHash } = await simulateAgentProcessing(kwh)

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'mint',
      amount: kwh,
      timestamp: Date.now(),
      status: 'confirmed',
      txHash,
      ipfsHash,
    }

    setTransactions((current = []) => [newTransaction, ...current].slice(0, 20))

    setBalance((current = { sarc: 0, usdc: 0 }) => ({
      sarc: current.sarc + kwh,
      usdc: current.usdc,
    }))

    setProfile((current = profile!) => ({
      ...current,
      totalGenerated: current.totalGenerated + kwh,
    }))

    const today = new Date().toISOString().split('T')[0]
    setEnergyData((current = []) => {
      const updated = [...current]
      const todayIndex = updated.findIndex(d => d.date === today)
      if (todayIndex >= 0) {
        updated[todayIndex].kwh += kwh
      } else {
        updated.push({ date: today, kwh })
      }
      return updated.slice(-30)
    })
  }

  const handleRedeem = async (amount: number) => {
    if (!wallet?.connected) {
      toast.error('Please connect your wallet first')
      return
    }

    await new Promise(resolve => setTimeout(resolve, 2000))

    const usdcAmount = amount * EXCHANGE_RATE

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'redeem',
      amount,
      usdcAmount,
      timestamp: Date.now(),
      status: 'confirmed',
      txHash: generateTxHash(),
    }

    setTransactions((current = []) => [newTransaction, ...current].slice(0, 20))

    setBalance((current = { sarc: 0, usdc: 0 }) => ({
      sarc: current.sarc - amount,
      usdc: current.usdc + usdcAmount,
    }))

    setProfile((current = profile!) => ({
      ...current,
      totalEarned: current.totalEarned + usdcAmount,
    }))
  }

  if (!wallet?.connected) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <Hero3D />
        <Toaster position="top-right" />
        
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <div className="max-w-6xl w-full">
            <div className="text-center space-y-12">
              <div className="relative inline-block">
                <GlowOrb size={280} color="primary" className="mx-auto animate-glow" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sun size={120} weight="fill" className="text-primary drop-shadow-[0_0_30px_oklch(0.65_0.25_265)]" />
                </div>
              </div>
              
              <div className="space-y-6">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent">
                  Revolutionizing Solar Energy
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  AI-Powered tokenization platform turning solar energy into digital assets with blockchain-class security, AI-driven automation, and instant USDC settlement
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 text-left max-w-4xl mx-auto">
                <div className="glass-card p-8 group hover:scale-105 transition-transform duration-300">
                  <Lightning size={48} weight="fill" className="text-primary mb-4 drop-shadow-[0_0_15px_oklch(0.65_0.25_265)] group-hover:animate-glow" />
                  <h3 className="font-semibold text-lg mb-2">Instant Tokenization</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Convert solar generation to sARC tokens with AI-powered validation in seconds
                  </p>
                </div>
                <div className="glass-card p-8 group hover:scale-105 transition-transform duration-300">
                  <CurrencyCircleDollar size={48} weight="fill" className="text-accent mb-4 drop-shadow-[0_0_15px_oklch(0.70_0.18_330)] group-hover:animate-glow" />
                  <h3 className="font-semibold text-lg mb-2">USDC Settlement</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Seamless redemption to USDC on Arc blockchain with transparent rates
                  </p>
                </div>
                <div className="glass-card p-8 group hover:scale-105 transition-transform duration-300">
                  <ChartLine size={48} weight="fill" className="text-secondary mb-4 drop-shadow-[0_0_15px_oklch(0.55_0.20_210)] group-hover:animate-glow" />
                  <h3 className="font-semibold text-lg mb-2">AI Automation</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Autonomous agents validate, verify, and mint tokens with zero manual oversight
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <WalletButton
                  wallet={wallet || { connected: false, address: null, network: ARC_TESTNET.name }}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                />
              </div>

              <p className="text-xs text-muted-foreground/60">
                Demo Mode • Arc Testnet • Built for AI Agents x ARC Hackathon
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute inset-0 opacity-30">
        <Hero3D />
      </div>
      
      <Toaster position="top-right" />
      
      <header className="relative z-50 border-b border-border/50 glass-card sticky top-0">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-lg bg-primary/20 blur-md"></div>
                <div className="relative p-1.5 sm:p-2 bg-primary/10 rounded-lg border border-primary/30">
                  <Sun size={28} weight="fill" className="text-primary sm:w-8 sm:h-8 drop-shadow-[0_0_10px_oklch(0.65_0.25_265)]" />
                </div>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">SOLR-ARC</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Solar Energy Tokenization</p>
              </div>
            </div>
            
            <div className="w-full sm:w-auto">
              <WalletButton
                wallet={wallet}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 h-auto glass-card p-1">
            <TabsTrigger value="overview" className="gap-1.5 sm:gap-2 flex-col sm:flex-row py-2 sm:py-1.5 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <ChartLine size={18} className="flex-shrink-0" />
              <span className="text-xs sm:text-sm">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="mint" className="gap-1.5 sm:gap-2 flex-col sm:flex-row py-2 sm:py-1.5 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Lightning size={18} className="flex-shrink-0" />
              <span className="text-xs sm:text-sm">Mint</span>
            </TabsTrigger>
            <TabsTrigger value="redeem" className="gap-1.5 sm:gap-2 flex-col sm:flex-row py-2 sm:py-1.5 data-[state=active]:bg-accent/20 data-[state=active]:text-accent">
              <ArrowsLeftRight size={18} className="flex-shrink-0" />
              <span className="text-xs sm:text-sm">Redeem</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-1.5 sm:gap-2 flex-col sm:flex-row py-2 sm:py-1.5 data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary">
              <UserCircle size={18} className="flex-shrink-0" />
              <span className="text-xs sm:text-sm">Profile</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="sARC Balance"
                value={formatNumber(balance?.sarc || 0)}
                subtitle="Solar Energy Tokens"
                icon={<Coins size={32} weight="fill" />}
                glowColor="primary"
              />
              <StatsCard
                title="USDC Balance"
                value={formatCurrency(balance?.usdc || 0)}
                subtitle="Redeemable Value"
                icon={<CurrencyCircleDollar size={32} weight="fill" />}
                glowColor="accent"
              />
              <StatsCard
                title="Total Generated"
                value={`${formatNumber(profile?.totalGenerated || 0)} kWh`}
                subtitle="Lifetime Energy"
                icon={<Lightning size={32} weight="fill" />}
                glowColor="primary"
              />
              <StatsCard
                title="Total Earned"
                value={formatCurrency(profile?.totalEarned || 0)}
                subtitle="USDC Redeemed"
                icon={<ChartLine size={32} weight="fill" />}
                glowColor="secondary"
              />
            </div>

            <EnergyChart data={energyData || []} />

            <TransactionFeed transactions={transactions || []} />
          </TabsContent>

          <TabsContent value="mint" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <EnergyInput onSubmit={handleMint} dailyUsed={dailyUsed} />
              {minting && <AgentStatus agents={agents} progress={progress} />}
            </div>
          </TabsContent>

          <TabsContent value="redeem" className="space-y-6">
            <div className="max-w-2xl mx-auto">
              <RedemptionForm balance={balance?.sarc || 0} onRedeem={handleRedeem} />
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="glass-card p-6 border border-border/50">
                <h3 className="text-lg font-semibold mb-4">Producer Profile</h3>
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-border/30">
                    <span className="text-muted-foreground">System Capacity</span>
                    <span className="font-semibold">{profile?.systemCapacity || 0} kW</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border/30">
                    <span className="text-muted-foreground">Daily Cap</span>
                    <span className="font-semibold">{profile?.dailyCap || 0} kWh</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border/30">
                    <span className="text-muted-foreground">Daily Used</span>
                    <span className="font-semibold">{formatNumber(dailyUsed)} kWh</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border/30">
                    <span className="text-muted-foreground">Lifetime Energy</span>
                    <span className="font-semibold">{formatNumber(profile?.totalGenerated || 0)} kWh</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border/30">
                    <span className="text-muted-foreground">Total Earned</span>
                    <span className="font-semibold text-accent">{formatCurrency(profile?.totalEarned || 0)}</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-muted-foreground">Member Since</span>
                    <span className="font-semibold">
                      {new Date(profile?.joinedDate || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="relative z-10 border-t border-border/50 mt-12 py-6 glass-card">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Built for AI Agents x ARC with USDC Hackathon • Powered by Arc Blockchain</p>
        </div>
      </footer>
    </div>
  )
}

export default App
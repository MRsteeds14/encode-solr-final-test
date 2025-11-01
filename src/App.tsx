import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Toaster, toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Sun, Lightning, ChartLine, ArrowsLeftRight, UserCircle, Coins, CurrencyCircleDollar } from '@phosphor-icons/react'

import { WalletButton } from '@/components/wallet/WalletButton'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { EnergyChart } from '@/components/dashboard/EnergyChart'
import { TransactionFeed } from '@/components/dashboard/TransactionFeed'
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Toaster position="top-right" />
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="flex items-center justify-center">
            <div className="p-4 bg-primary/10 rounded-2xl">
              <Sun size={64} weight="fill" className="text-primary" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Welcome to SOLR-ARC
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg mx-auto">
              AI-Powered Solar Energy Tokenization Platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="p-6 bg-card border border-border rounded-lg">
              <Lightning size={32} weight="fill" className="text-primary mb-3" />
              <h3 className="font-semibold mb-2">Energy to Tokens</h3>
              <p className="text-sm text-muted-foreground">
                Convert solar generation to sARC tokens instantly
              </p>
            </div>
            <div className="p-6 bg-card border border-border rounded-lg">
              <CurrencyCircleDollar size={32} weight="fill" className="text-accent mb-3" />
              <h3 className="font-semibold mb-2">USDC Settlement</h3>
              <p className="text-sm text-muted-foreground">
                Redeem tokens for USDC on Arc blockchain
              </p>
            </div>
            <div className="p-6 bg-card border border-border rounded-lg">
              <ChartLine size={32} weight="fill" className="text-secondary mb-3" />
              <h3 className="font-semibold mb-2">AI Automation</h3>
              <p className="text-sm text-muted-foreground">
                Autonomous agents validate and mint tokens
              </p>
            </div>
          </div>

          <WalletButton
            wallet={wallet || { connected: false, address: null, network: ARC_TESTNET.name }}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />

          <p className="text-xs text-muted-foreground">
            Demo mode • Arc Testnet • For hackathon demonstration
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />
      
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sun size={32} weight="fill" className="text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">SOLR-ARC</h1>
                <p className="text-xs text-muted-foreground">Solar Energy Tokenization</p>
              </div>
            </div>
            
            <WalletButton
              wallet={wallet}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4">
            <TabsTrigger value="overview" className="gap-2">
              <ChartLine size={18} />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="mint" className="gap-2">
              <Lightning size={18} />
              <span className="hidden sm:inline">Mint</span>
            </TabsTrigger>
            <TabsTrigger value="redeem" className="gap-2">
              <ArrowsLeftRight size={18} />
              <span className="hidden sm:inline">Redeem</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2">
              <UserCircle size={18} />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="sARC Balance"
                value={formatNumber(balance?.sarc || 0)}
                subtitle="Solar Energy Tokens"
                icon={<Coins size={32} weight="fill" />}
              />
              <StatsCard
                title="USDC Balance"
                value={formatCurrency(balance?.usdc || 0)}
                subtitle="Redeemable Value"
                icon={<CurrencyCircleDollar size={32} weight="fill" />}
              />
              <StatsCard
                title="Total Generated"
                value={`${formatNumber(profile?.totalGenerated || 0)} kWh`}
                subtitle="Lifetime Energy"
                icon={<Lightning size={32} weight="fill" />}
              />
              <StatsCard
                title="Total Earned"
                value={formatCurrency(profile?.totalEarned || 0)}
                subtitle="USDC Redeemed"
                icon={<ChartLine size={32} weight="fill" />}
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
              <div className="p-6 bg-card border border-border rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Producer Profile</h3>
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">System Capacity</span>
                    <span className="font-semibold">{profile?.systemCapacity || 0} kW</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">Daily Cap</span>
                    <span className="font-semibold">{profile?.dailyCap || 0} kWh</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">Daily Used</span>
                    <span className="font-semibold">{formatNumber(dailyUsed)} kWh</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">Lifetime Energy</span>
                    <span className="font-semibold">{formatNumber(profile?.totalGenerated || 0)} kWh</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border">
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

      <footer className="border-t border-border mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Built for AI Agents x ARC with USDC Hackathon • Demo Application</p>
        </div>
      </footer>
    </div>
  )
}

export default App
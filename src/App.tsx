import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Toaster, toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Sun, Lightning, ChartLine, ArrowsLeftRight, UserCircle, Coins, CurrencyCircleDollar } from '@phosphor-icons/react'
import { Navigation } from '@/components/Navigation'
import { WalletButton } from '@/components/wallet/WalletButton'
import { useCircleWallet } from '@/hooks/useCircleWallet'
import { LoadingCard } from '@/components/dashboard/LoadingCard'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { EnergyChart } from '@/components/dashboard/EnergyChart'
import { TransactionFeed } from '@/components/dashboard/TransactionFeed'
import Web3Background from '@/components/dashboard/Web3Background'
import { GlowOrb } from '@/components/dashboard/GlowOrb'
import { EnergyInput } from '@/components/minting/EnergyInput'
import { AgentStatus } from '@/components/minting/AgentStatus'
import { RedemptionForm } from '@/components/redemption/RedemptionForm'
import { RegisterSystem } from '@/components/RegisterSystem'

import { Transaction, WalletState, ProducerProfile, EnergyData, AgentStatus as AgentStatusType, TokenBalance } from '@/types'
import { ARC_TESTNET, EXCHANGE_RATE, USDC_DECIMALS } from '@/lib/constants'
import { generateTxHash, formatNumber, formatCurrency, generateEnergyData } from '@/lib/helpers'
import { useProducerStatus } from '@/hooks/useProducerStatus'
import { useBalances } from '@/hooks/useTokenBalances'
import { pogAgentAPI, type AgentProcessingStatus } from '@/lib/pog-agent-api'
import { useRedeemForUSDC } from '@/hooks/useTreasury'
import { signAndSendTransaction } from '@/lib/circle-contracts'
import { CONTRACT_ADDRESSES } from '@/lib/contracts'
import { formatUnits, parseUnits } from 'ethers'

function App() {
  // Get connected wallet from Circle
  const { wallet, address: walletAddress, isConnected } = useCircleWallet()

  // Check if user is registered as a producer
  const { isRegistered, producerData, isLoading: isCheckingRegistration, refetch: refetchProducerStatus, error: registrationError } = useProducerStatus(walletAddress ?? undefined)
  
  // Get token balances from blockchain
  const { sarc: sarcBalance, usdc: usdcBalance, refetch: refetchBalances } = useBalances(walletAddress ?? undefined)

  // Redemption hook for Treasury contract
  const { redeemForUSDC } = useRedeemForUSDC()

  // UI state for showing registration modal
  const [showRegistration, setShowRegistration] = useState(false)

  // Debug logging
  useEffect(() => {
    if (walletAddress) {
      console.log('👛 Wallet connected:', walletAddress);
      console.log('📋 Registration status:', { isRegistered, isCheckingRegistration, producerData });
      if (registrationError) {
        console.error('❌ Registration check error:', registrationError);
      }
    } else {
      console.log('👋 No wallet connected - showing landing page');
    }
  }, [walletAddress, isRegistered, isCheckingRegistration, producerData, registrationError]);

  // Force cleanup when wallet disconnects
  useEffect(() => {
    if (!isConnected && !walletAddress) {
      // Reset all state when wallet disconnects
      setShowRegistration(false);
      setActiveTab('overview');
      console.log('🔄 Wallet disconnected - state reset');
    }
  }, [isConnected, walletAddress]);

  // Local state for UI
  const [transactions, setTransactions] = useKV<Transaction[]>(`transactions_${walletAddress}`, [])
  const [energyData, setEnergyData] = useKV<EnergyData[]>(`energyData_${walletAddress}`, generateEnergyData(30))
  const [activeTab, setActiveTab] = useState('overview')
  const [minting, setMinting] = useState(false)
  const [agents, setAgents] = useState<AgentStatusType[]>([])
  const [progress, setProgress] = useState(0)

  // Derived profile from blockchain data with proper BigInt handling
  const profile: ProducerProfile | null = producerData?.isWhitelisted ? {
    address: walletAddress!,
    systemCapacity: producerData.systemCapacityKw ? Number(producerData.systemCapacityKw) : 0,
    dailyCap: producerData.dailyCapKwh ? Number(producerData.dailyCapKwh) : 0,
    totalGenerated: producerData.totalMinted ? Number(formatUnits(producerData.totalMinted, 18)) : 0,
    totalEarned: (transactions || [])
      .filter(tx => tx.type === 'redeem')
      .reduce((sum, tx) => sum + (tx.usdcAmount || 0), 0),
    joinedDate: producerData.registrationDate ? Number(producerData.registrationDate) * 1000 : Date.now(),
  } : null

  // Debug log profile data
  useEffect(() => {
    if (profile) {
      console.log('📊 Profile data:', {
        systemCapacity: profile.systemCapacity,
        dailyCap: profile.dailyCap,
        totalGenerated: profile.totalGenerated,
        rawProducerData: producerData
      });
    }
  }, [profile, producerData]);

  // Token balances (convert from BigInt to number for display)
  const balance: TokenBalance = {
    sarc: Number(formatUnits((typeof sarcBalance.balance === 'bigint' ? sarcBalance.balance : 0n), 18)),
    usdc: Number(formatUnits((typeof usdcBalance.balance === 'bigint' ? usdcBalance.balance : 0n), USDC_DECIMALS)),
  }

  const dailyUsed = (transactions || [])
    .filter(tx => {
      const today = new Date().toDateString()
      return new Date(tx.timestamp).toDateString() === today && tx.type === 'mint'
    })
    .reduce((sum, tx) => sum + tx.amount, 0)

  // Handle successful registration
  const handleRegistrationSuccess = async () => {
    console.log('🎉 Registration successful, refetching status...');
    setShowRegistration(false); // Close registration modal
    toast.success('Welcome to SOLR-ARC! Your system is now registered.');
    
    // Wait a moment for blockchain confirmation, then refetch
    setTimeout(async () => {
      await refetchProducerStatus();
      console.log('✅ Producer data refreshed:', producerData);
    }, 2000);
  }

  const handleMint = async (kwh: number) => {
    if (!walletAddress) {
      toast.error('Please connect your wallet first')
      return
    }

    // Check if PoG Agent is accessible
    const pogAgentHealthy = await pogAgentAPI.healthCheck();
    if (!pogAgentHealthy) {
      toast.error('PoG Agent service unavailable', {
        description: 'The minting service is currently offline. Please contact support or try again later.',
      });
      return;
    }

    setMinting(true)
    setProgress(0)

    // Initialize agent status display
    const agentSteps: AgentStatusType[] = [
      { name: 'Risk & Policy Agent', status: 'idle', message: 'Waiting to validate...' },
      { name: 'Proof-of-Generation Agent', status: 'idle', message: 'Waiting to process...' },
    ]
    setAgents(agentSteps)

    try {
      // Call PoG Agent API with progress tracking
      const result = await pogAgentAPI.submitGeneration(
        {
          producerAddress: walletAddress,
          kwhGenerated: kwh,
          timestamp: Date.now(),
          metadata: {
            systemCapacity: profile?.systemCapacity,
          },
        },
        (status: AgentProcessingStatus) => {
          // Update agent status based on processing step
          switch (status.step) {
            case 'validating':
              setAgents([
                { name: 'Risk & Policy Agent', status: 'processing', message: status.message },
                { name: 'Proof-of-Generation Agent', status: 'idle', message: 'Waiting to process...' },
              ])
              setProgress(status.progress)
              break
            case 'uploading':
            case 'minting':
              setAgents([
                { name: 'Risk & Policy Agent', status: 'completed', message: 'Validation passed ✓' },
                { name: 'Proof-of-Generation Agent', status: 'processing', message: status.message },
              ])
              setProgress(status.progress)
              break
            case 'confirming':
              setAgents([
                { name: 'Risk & Policy Agent', status: 'completed', message: 'Validation passed ✓' },
                { name: 'Proof-of-Generation Agent', status: 'processing', message: status.message },
              ])
              setProgress(status.progress)
              break
            case 'completed':
              setAgents([
                { name: 'Risk & Policy Agent', status: 'completed', message: 'Validation passed ✓' },
                { name: 'Proof-of-Generation Agent', status: 'completed', message: status.message },
              ])
              setProgress(100)
              break
            case 'error':
              setAgents([
                { name: 'Risk & Policy Agent', status: 'completed', message: 'Validation passed ✓' },
                { name: 'Proof-of-Generation Agent', status: 'idle', message: `Error: ${status.message}` },
              ])
              break
          }
        }
      )

      // Create transaction record with real blockchain data
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: 'mint',
        amount: kwh,
        timestamp: Date.now(),
        status: 'confirmed',
        txHash: result.txHash,
        ipfsHash: result.ipfsProof,
      }

      setTransactions((current = []) => [newTransaction, ...current].slice(0, 20))

      // Update energy chart
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

      // Show success notification with transaction link
      toast.success(
        `Successfully minted ${result.mintedAmount} sARC tokens!`,
        {
          description: `View on Arc Testnet: ${result.txHash.slice(0, 10)}...`,
          action: {
            label: 'View TX',
            onClick: () => window.open(`https://testnet.arcscan.app/tx/${result.txHash}`, '_blank'),
          },
        }
      )

      // Refresh balances and producer status from blockchain
      await Promise.all([
        refetchBalances(),
        refetchProducerStatus()
      ]);
      
      console.log('✅ Balances and producer data refreshed after minting');
    } catch (error) {
      console.error('Minting error:', error)
      toast.error('Minting failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      })
    } finally {
      setMinting(false)
    }
  }

  const handleRedeem = async (amount: number) => {
    if (!walletAddress || !wallet) {
      toast.error('Please connect your wallet first')
      return
    }

    try {
      const amountAsString = amount.toString()
      const sarcAmountWei = parseUnits(amountAsString, 18)

      // Step 1: Approve Treasury to spend sARC tokens
      toast.info('Step 1/2: Approving Treasury contract...', {
        description: 'Signing approval transaction via Circle...',
      })

      await signAndSendTransaction(
        wallet.id,
        CONTRACT_ADDRESSES.SARC_TOKEN,
        'approve',
        [CONTRACT_ADDRESSES.TREASURY, sarcAmountWei]
      )
      
      toast.success('Approval confirmed!')

      // Step 2: Redeem sARC for USDC
      toast.info('Step 2/2: Redeeming sARC for USDC...', {
        description: 'Signing redemption transaction...',
      })

      const ipfsMetadata = `QmRedemption-${walletAddress}-${Date.now()}`
      
      const redemptionTx = await signAndSendTransaction(
        wallet.id,
        CONTRACT_ADDRESSES.TREASURY,
        'redeemForUSDC',
        [sarcAmountWei, ipfsMetadata]
      )

      const usdcAmount = amount * EXCHANGE_RATE

      const newTransaction: Transaction = {
        id: Date.now().toString(),
        type: 'redeem',
        amount,
        usdcAmount,
        timestamp: Date.now(),
        status: 'confirmed',
        txHash: redemptionTx.txHash,
      }

      setTransactions((current = []) => [newTransaction, ...current].slice(0, 20))

      toast.success(`Successfully redeemed ${formatNumber(amount)} sARC!`, {
        description: `Received ${formatCurrency(usdcAmount)}`,
        action: {
          label: 'View TX',
          onClick: () => window.open(`https://testnet.arcscan.app/tx/${redemptionTx.txHash}`, '_blank'),
        },
      })

      // Refresh balances and producer status
      await Promise.all([
        refetchBalances(),
        refetchProducerStatus()
      ]);
      
      console.log('✅ Balances refreshed after redemption');
    } catch (error) {
      console.error('Redemption error:', error)
      toast.error('Redemption failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      })
    }
  }

  // Show loading state while checking registration
  if (walletAddress && isCheckingRegistration) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
        <Web3Background />
        <Toaster position="top-right" />
        <div className="relative z-10 text-center space-y-4">
          <GlowOrb size={120} color="primary" className="mx-auto animate-pulse" />
          <p className="text-muted-foreground">Checking registration status...</p>
        </div>
      </div>
    )
  }

  // Show registration modal if user clicked register button
  if (showRegistration && walletAddress) {
    return (
      <>
        <Toaster position="top-right" />
        <RegisterSystem 
          walletAddress={walletAddress} 
          onSuccess={handleRegistrationSuccess}
        />
      </>
    )
  }

  // Show landing page if not connected
  if (!walletAddress) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <Web3Background />
        <Toaster position="top-right" />
        
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8">
          <div className="max-w-6xl w-full">
            <div className="text-center space-y-8 md:space-y-12">
              <div className="relative inline-block">
                <GlowOrb size={window.innerWidth < 640 ? 180 : window.innerWidth < 768 ? 220 : 280} color="primary" className="mx-auto animate-glow" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sun size={window.innerWidth < 640 ? 70 : window.innerWidth < 768 ? 90 : 120} weight="fill" className="text-primary drop-shadow-[0_0_20px_oklch(0.65_0.25_265)] md:drop-shadow-[0_0_30px_oklch(0.65_0.25_265)]" />
                </div>
              </div>
              
              <div className="space-y-4 md:space-y-6 px-2">
                <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent leading-tight">
                  Revolutionizing Solar Energy
                </h1>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-2">
                  AI-Powered tokenization platform turning solar energy into digital assets with blockchain-class security, AI-driven automation, and instant USDC settlement
                </p>
              </div>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 text-left max-w-4xl mx-auto">
                <div className="glass-card p-5 md:p-8 group hover:scale-105 transition-transform duration-300">
                  <Lightning size={window.innerWidth < 640 ? 36 : 48} weight="fill" className="text-primary mb-3 md:mb-4 drop-shadow-[0_0_10px_oklch(0.65_0.25_265)] md:drop-shadow-[0_0_15px_oklch(0.65_0.25_265)] group-hover:animate-glow" />
                  <h3 className="font-semibold text-base md:text-lg mb-2">Instant Tokenization</h3>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                    Convert solar generation to sARC tokens with AI-powered validation in seconds
                  </p>
                </div>
                <div className="glass-card p-5 md:p-8 group hover:scale-105 transition-transform duration-300">
                  <CurrencyCircleDollar size={window.innerWidth < 640 ? 36 : 48} weight="fill" className="text-accent mb-3 md:mb-4 drop-shadow-[0_0_10px_oklch(0.70_0.18_330)] md:drop-shadow-[0_0_15px_oklch(0.70_0.18_330)] group-hover:animate-glow" />
                  <h3 className="font-semibold text-base md:text-lg mb-2">USDC Settlement</h3>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                    Seamless redemption to USDC on Arc blockchain with transparent rates
                  </p>
                </div>
                <div className="glass-card p-5 md:p-8 group hover:scale-105 transition-transform duration-300 sm:col-span-2 md:col-span-1">
                  <ChartLine size={window.innerWidth < 640 ? 36 : 48} weight="fill" className="text-secondary mb-3 md:mb-4 drop-shadow-[0_0_10px_oklch(0.55_0.20_210)] md:drop-shadow-[0_0_15px_oklch(0.55_0.20_210)] group-hover:animate-glow" />
                  <h3 className="font-semibold text-base md:text-lg mb-2">AI Automation</h3>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                    Autonomous agents validate, verify, and mint tokens with zero manual oversight
                  </p>
                </div>
              </div>

              <div className="pt-4 flex flex-col items-center gap-4">
                <WalletButton />
                
                {/* Show Register button if wallet connected but not registered */}
                {walletAddress && !isRegistered && !isCheckingRegistration && (
                  <Button 
                    onClick={() => setShowRegistration(true)}
                    size="lg"
                    className="gap-2"
                  >
                    <Lightning size={20} weight="fill" />
                    Register Solar System
                  </Button>
                )}
              </div>

              <p className="text-xs text-muted-foreground/60 px-2">
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
      <div className="absolute inset-0 opacity-60">
        <Web3Background />
      </div>
      
      <Toaster position="top-right" />
      
      <Navigation showTabs={true} activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="relative z-10 container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 h-auto glass-card p-1">
            <TabsTrigger value="overview" className="gap-1 sm:gap-1.5 flex-col sm:flex-row py-2 sm:py-1.5 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <ChartLine size={16} className="sm:w-[18px] sm:h-[18px] flex-shrink-0" />
              <span className="text-[10px] sm:text-xs leading-tight">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="mint" className="gap-1 sm:gap-1.5 flex-col sm:flex-row py-2 sm:py-1.5 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              <Lightning size={16} className="sm:w-[18px] sm:h-[18px] flex-shrink-0" />
              <span className="text-[10px] sm:text-xs leading-tight">Mint</span>
            </TabsTrigger>
            <TabsTrigger value="redeem" className="gap-1 sm:gap-1.5 flex-col sm:flex-row py-2 sm:py-1.5 data-[state=active]:bg-accent/20 data-[state=active]:text-accent">
              <ArrowsLeftRight size={16} className="sm:w-[18px] sm:h-[18px] flex-shrink-0" />
              <span className="text-[10px] sm:text-xs leading-tight">Redeem</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-1 sm:gap-1.5 flex-col sm:flex-row py-2 sm:py-1.5 data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary">
              <UserCircle size={16} className="sm:w-[18px] sm:h-[18px] flex-shrink-0" />
              <span className="text-[10px] sm:text-xs leading-tight">Profile</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 md:space-y-6">
            <div className="grid gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {sarcBalance.isLoading || usdcBalance.isLoading ? (
                <>
                  <LoadingCard />
                  <LoadingCard />
                  <LoadingCard />
                  <LoadingCard />
                </>
              ) : (
                <>
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
                </>
              )}
            </div>

            <EnergyChart data={energyData || []} />

            <TransactionFeed transactions={transactions || []} />
          </TabsContent>

          <TabsContent value="mint" className="space-y-4 md:space-y-6">
            <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
              <EnergyInput onSubmit={handleMint} dailyUsed={dailyUsed} />
              {minting && <AgentStatus agents={agents} progress={progress} />}
            </div>
          </TabsContent>

          <TabsContent value="redeem" className="space-y-4 md:space-y-6">
            <div className="max-w-2xl mx-auto">
              <RedemptionForm balance={balance?.sarc || 0} onRedeem={handleRedeem} />
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4 md:space-y-6">
            <div className="max-w-2xl mx-auto space-y-4 md:space-y-6">
              <div className="glass-card p-4 md:p-6 border border-border/50">
                <div className="flex justify-between items-center mb-3 md:mb-4">
                  <h3 className="text-base md:text-lg font-semibold">Producer Profile</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => refetchProducerStatus()}
                    disabled={isCheckingRegistration}
                    className="gap-1.5"
                  >
                    {isCheckingRegistration ? (
                      <>
                        <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <ArrowsLeftRight size={14} weight="bold" />
                        Refresh
                      </>
                    )}
                  </Button>
                </div>
                {isCheckingRegistration ? (
                  <div className="space-y-3 md:space-y-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="flex justify-between py-2 md:py-3 border-b border-border/30 gap-2">
                        <div className="h-4 bg-muted/30 rounded w-1/3 animate-pulse"></div>
                        <div className="h-4 bg-muted/30 rounded w-1/4 animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex justify-between py-2 md:py-3 border-b border-border/30 gap-2">
                      <span className="text-xs md:text-sm text-muted-foreground">System Capacity</span>
                      <span className="text-sm md:text-base font-semibold">{profile?.systemCapacity || 0} kW</span>
                    </div>
                  <div className="flex justify-between py-2 md:py-3 border-b border-border/30 gap-2">
                    <span className="text-xs md:text-sm text-muted-foreground">Daily Cap</span>
                    <span className="text-sm md:text-base font-semibold">{profile?.dailyCap || 0} kWh</span>
                  </div>
                  <div className="flex justify-between py-2 md:py-3 border-b border-border/30 gap-2">
                    <span className="text-xs md:text-sm text-muted-foreground">Daily Used</span>
                    <span className="text-sm md:text-base font-semibold">{formatNumber(dailyUsed)} kWh</span>
                  </div>
                  <div className="flex justify-between py-2 md:py-3 border-b border-border/30 gap-2">
                    <span className="text-xs md:text-sm text-muted-foreground">Lifetime Energy</span>
                    <span className="text-sm md:text-base font-semibold">{formatNumber(profile?.totalGenerated || 0)} kWh</span>
                  </div>
                  <div className="flex justify-between py-2 md:py-3 border-b border-border/30 gap-2">
                    <span className="text-xs md:text-sm text-muted-foreground">Total Earned</span>
                    <span className="text-sm md:text-base font-semibold text-accent">{formatCurrency(profile?.totalEarned || 0)}</span>
                  </div>
                  <div className="flex justify-between py-2 md:py-3 gap-2">
                    <span className="text-xs md:text-sm text-muted-foreground">Member Since</span>
                    <span className="text-sm md:text-base font-semibold">
                      {new Date(profile?.joinedDate || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="relative z-10 border-t border-border/50 mt-8 md:mt-12 py-4 md:py-6 glass-card">
        <div className="container mx-auto px-3 sm:px-4 text-center text-xs md:text-sm text-muted-foreground">
          <p>Built for AI Agents x ARC with USDC Hackathon • Powered by Arc Blockchain</p>
        </div>
      </footer>
    </div>
  )
}

export default App

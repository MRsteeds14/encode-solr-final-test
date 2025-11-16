/**
 * Registration form for new solar producers
 * Fixed system size with automatic navigation
 */

import { useState, useEffect } from 'react';
import { Sun, Lightning, CheckCircle } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRegisterProducer } from '@/hooks/useRegisterProducer';
import { toast } from 'sonner';
import { WalletButton } from '@/components/wallet/WalletButton';
import Web3Background from '@/components/dashboard/Web3Background';
import { GlowOrb } from '@/components/dashboard/GlowOrb';
import { ethers } from 'ethers';

interface RegisterSystemProps {
  walletAddress: string;
  onSuccess: () => void;
}

// Fixed system specs: 10kW with 80 kWh daily production
const FIXED_SYSTEM_CAPACITY = 10; // kW
const FIXED_DAILY_CAP = 80; // kWh (10kW * 8 hours average)

export function RegisterSystem({ walletAddress, onSuccess }: RegisterSystemProps) {
  const { register, isPending, data: txData } = useRegisterProducer();
  const [isWaitingForConfirmation, setIsWaitingForConfirmation] = useState(false);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [txStatus, setTxStatus] = useState<string>('INITIATED');

  // Poll Circle API for transaction status
  useEffect(() => {
    if (!txData || !isWaitingForConfirmation) return;

    const WORKER_URL = import.meta.env.VITE_CIRCLE_DEV_WALLET_WORKER_URL;
    const transactionId = txData.txHash || txData.transaction?.id;
    
    if (!transactionId) {
      console.error('❌ No transaction ID found');
      return;
    }

    let interval: NodeJS.Timeout;
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes total (2 second intervals)

    const checkTransactionStatus = async () => {
      try {
        attempts++;
        setPollingAttempts(attempts);
        
        console.log(`🔍 Checking transaction status (attempt ${attempts}/${maxAttempts})...`);
        
        // Check Circle transaction status
        const response = await fetch(`${WORKER_URL}/api/transactions/${transactionId}`);
        const data = await response.json();
        
        if (data.success && data.transaction) {
          const state = data.transaction.state;
          setTxStatus(state);
          
          console.log(`📊 Transaction state: ${state}`);
          
          // Circle transaction states:
          // INITIATED → QUEUED → SENT → CONFIRMED → COMPLETE
          if (state === 'COMPLETE' || state === 'CONFIRMED') {
            console.log('✅ Transaction confirmed by Circle!');
            clearInterval(interval);
            
            // Wait a moment for registry to update, then verify
            toast.success('Transaction confirmed! Verifying registration...');
            
            setTimeout(async () => {
              try {
                const provider = new ethers.JsonRpcProvider('https://rpc.testnet.arc.network');
                const registry = new ethers.Contract(
                  '0xc9559c5884e53548b3d2362aa694b64519d291ee',
                  ['function isWhitelisted(address) view returns (bool)'],
                  provider
                );
                
                const isWhitelisted = await registry.isWhitelisted(walletAddress);
                
                if (isWhitelisted) {
                  console.log('✅ Registration verified on-chain!');
                  toast.success('Registration complete!');
                  onSuccess();
                } else {
                  console.log('⏱️ Registry not updated yet, checking again...');
                  // Try one more time after 3 seconds
                  setTimeout(async () => {
                    const recheck = await registry.isWhitelisted(walletAddress);
                    if (recheck) {
                      console.log('✅ Registration verified on second check!');
                      toast.success('Registration complete!');
                      onSuccess();
                    } else {
                      toast.error('Registration transaction succeeded but not showing in registry. Please refresh.');
                    }
                  }, 3000);
                }
              } catch (error) {
                console.error('Error verifying registration:', error);
                toast.error('Could not verify registration. Please refresh.');
              }
            }, 2000);
          } else if (state === 'FAILED' || state === 'DENIED' || state === 'CANCELLED') {
            console.error('❌ Transaction failed:', state);
            clearInterval(interval);
            toast.error(`Transaction ${state.toLowerCase()}. Please try again.`);
            setIsWaitingForConfirmation(false);
          }
        }
        
        if (attempts >= maxAttempts) {
          console.log('⏱️ Max polling attempts reached');
          clearInterval(interval);
          toast.error('Transaction taking longer than expected. Please check later and refresh.');
          setIsWaitingForConfirmation(false);
        }
      } catch (error) {
        console.error('Error checking transaction status:', error);
      }
    };

    // Start polling every 2 seconds
    checkTransactionStatus(); // Check immediately
    interval = setInterval(checkTransactionStatus, 2000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [txData, isWaitingForConfirmation, walletAddress, onSuccess]);

  const handleRegister = async () => {
    try {
      setIsWaitingForConfirmation(true);
      toast.info('Please confirm the transaction in your wallet...');
      
      await register(
        walletAddress,
        FIXED_SYSTEM_CAPACITY,
        FIXED_DAILY_CAP,
        '' // IPFS metadata
      );
      
      toast.success('Transaction submitted! Waiting for confirmation...');
    } catch (error: any) {
      console.error('Registration error:', error);
      setIsWaitingForConfirmation(false);
      
      if (error?.message?.includes('user rejected')) {
        toast.error('Transaction cancelled');
      } else {
        toast.error(error?.message || 'Failed to register system');
      }
    }
  };

  if (isWaitingForConfirmation && txData) {
    const statusMessages: Record<string, string> = {
      'INITIATED': 'Transaction initiated...',
      'QUEUED': 'Transaction queued...',
      'SENT': 'Transaction sent to blockchain...',
      'CONFIRMED': 'Transaction confirmed! Verifying...',
      'COMPLETE': 'Transaction complete! Loading dashboard...',
    };

    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Navigation Bar */}
        <header className="relative z-50 border-b border-border/50 glass-card">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun size={28} weight="fill" className="text-primary" />
                <span className="text-lg font-bold">SOLR-ARC</span>
              </div>
              <WalletButton />
            </div>
          </div>
        </header>

        <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
          <Web3Background />
          <div className="text-center space-y-6">
            <div className="relative inline-block">
              <GlowOrb size={200} color="primary" className="mx-auto animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <CheckCircle size={100} weight="fill" className="text-primary drop-shadow-[0_0_30px_oklch(0.65_0.25_265)]" />
              </div>
            </div>
            <h2 className="text-3xl font-bold">Registering System</h2>
            <div className="space-y-2">
              <p className="text-muted-foreground">
                {statusMessages[txStatus] || 'Processing transaction...'}
              </p>
              <p className="text-sm text-muted-foreground/60">
                Status: <span className="font-mono text-primary">{txStatus}</span>
              </p>
              <p className="text-xs text-muted-foreground/60">
                Check {pollingAttempts} / 60
              </p>
            </div>
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Navigation Bar */}
      <header className="relative z-50 border-b border-border/50 glass-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun size={28} weight="fill" className="text-primary" />
              <span className="text-lg font-bold">SOLR-ARC</span>
            </div>
            <WalletButton />
          </div>
        </div>
      </header>

      <div className="absolute inset-0 opacity-30">
        <Web3Background />
      </div>
      
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
        <div className="max-w-2xl w-full space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <GlowOrb size={120} color="primary" className="mx-auto" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sun size={60} weight="fill" className="text-primary drop-shadow-[0_0_20px_oklch(0.65_0.25_265)]" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Register Your Solar System
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              Join SOLR-ARC and start tokenizing your solar energy
            </p>
          </div>

          {/* Registration Card */}
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Lightning size={24} weight="fill" className="text-primary" />
                Standard Solar System
              </CardTitle>
              <CardDescription>
                Your system will be registered with these specifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Wallet Address Display */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Your Wallet Address</p>
                <div className="p-3 bg-muted/50 rounded-md font-mono text-xs sm:text-sm break-all">
                  {walletAddress}
                </div>
              </div>

              {/* Fixed System Specs */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">System Capacity</p>
                  <p className="text-2xl font-bold text-primary">{FIXED_SYSTEM_CAPACITY} kW</p>
                </div>
                <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Daily Production Cap</p>
                  <p className="text-2xl font-bold text-primary">{FIXED_DAILY_CAP} kWh</p>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Lightning size={16} weight="fill" className="text-secondary" />
                  What happens next?
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Your wallet will be registered as a solar producer</li>
                  <li>✓ You'll be able to mint sARC tokens for your energy</li>
                  <li>✓ Each token represents 1 kWh of solar energy</li>
                  <li>✓ Redeem your tokens for USDC anytime</li>
                </ul>
              </div>

              {/* Register Button */}
              <Button
                onClick={handleRegister}
                className="w-full"
                size="lg"
                disabled={isPending || isWaitingForConfirmation}
              >
                {isPending || isWaitingForConfirmation ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                    {isPending ? 'Confirm in Wallet...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <Lightning size={20} weight="fill" className="mr-2" />
                    Register My System
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground/60">
                This will submit a transaction to Arc Testnet. You'll need USDC for gas.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

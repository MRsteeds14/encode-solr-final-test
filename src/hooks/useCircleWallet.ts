/**
 * Circle Developer-Controlled Wallet Hook
 * 
 * Manages Circle wallet state and operations
 * Replaces useThirdwebWallet
 */

import { useState, useEffect, useCallback } from 'react';

interface CircleWallet {
  id: string;
  address: string;
  blockchain: string;
  state: string;
  accountType: string;
}

export interface CircleWalletState {
  wallet: CircleWallet | null;
  address: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

const CIRCLE_WORKER_URL = import.meta.env.VITE_CIRCLE_DEV_WALLET_WORKER_URL;
const WALLET_SET_ID = import.meta.env.VITE_CIRCLE_WALLET_SET_ID;

// Demo mode: Use pre-configured wallet from environment
const DEMO_WALLET_ID = import.meta.env.VITE_CIRCLE_WALLET_ID;
const DEMO_WALLET_ADDRESS = import.meta.env.VITE_CIRCLE_WALLET_ADDRESS;

export function useCircleWallet() {
  const [wallet, setWallet] = useState<CircleWallet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load wallet from localStorage on mount, or use demo wallet
  useEffect(() => {
    const savedWallet = localStorage.getItem('circle_wallet');
    const savedUserId = localStorage.getItem('circle_wallet_user_id');
    
    if (savedWallet) {
      try {
        const walletData = JSON.parse(savedWallet);
        setWallet(walletData);
        console.log('✅ Restored wallet for user:', savedUserId, 'Address:', walletData.address);
      } catch (e) {
        console.error('Failed to load wallet from localStorage', e);
        // Clear corrupted data
        localStorage.removeItem('circle_wallet');
        localStorage.removeItem('circle_wallet_user_id');
      }
    } else if (DEMO_WALLET_ID && DEMO_WALLET_ADDRESS) {
      // Use demo wallet from environment if no saved wallet
      const demoWallet: CircleWallet = {
        id: DEMO_WALLET_ID,
        address: DEMO_WALLET_ADDRESS,
        blockchain: 'ARC-TESTNET',
        state: 'LIVE',
        accountType: 'SCA',
      };
      setWallet(demoWallet);
      console.log('✅ Using demo wallet:', DEMO_WALLET_ADDRESS);
    }
  }, []);

  // Create new wallet via Circle Worker
  const createWallet = useCallback(async (userId: string): Promise<CircleWallet> => {
    if (!CIRCLE_WORKER_URL || !WALLET_SET_ID) {
      throw new Error('Circle configuration missing');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${CIRCLE_WORKER_URL}/api/wallets/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletSetId: WALLET_SET_ID,
          userId,
          blockchains: ['ARC-TESTNET'],
          count: 1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create wallet');
      }

      const { wallets } = await response.json();
      const newWallet = wallets[0];

      // Save to state and localStorage
      setWallet(newWallet);
      localStorage.setItem('circle_wallet', JSON.stringify(newWallet));
      localStorage.setItem('circle_wallet_user_id', userId);

      return newWallet;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create wallet';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh wallet data
  const refreshWallet = useCallback(async () => {
    if (!wallet || !CIRCLE_WORKER_URL) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${CIRCLE_WORKER_URL}/api/wallets/${wallet.id}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch wallet');
      }

      const { wallet: updatedWallet } = await response.json();
      setWallet(updatedWallet);
      localStorage.setItem('circle_wallet', JSON.stringify(updatedWallet));
    } catch (err: any) {
      setError(err.message || 'Failed to refresh wallet');
    } finally {
      setIsLoading(false);
    }
  }, [wallet]);

  // Disconnect wallet and clear state
  const disconnect = useCallback(() => {
    setWallet(null);
    setError(null);
    localStorage.removeItem('circle_wallet');
    localStorage.removeItem('circle_wallet_user_id');
  }, []);

  return {
    wallet,
    address: wallet?.address || null,
    isConnected: !!wallet,
    isLoading,
    error,
    createWallet,
    refreshWallet,
    disconnect,
  };
}

// Hook for wallet balances
export function useWalletBalances(walletId: string | null) {
  const [balances, setBalances] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!walletId || !CIRCLE_WORKER_URL) return;

    const fetchBalances = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${CIRCLE_WORKER_URL}/api/wallets/balance?walletId=${walletId}`
        );
        
        if (response.ok) {
          const data = await response.json();
          setBalances(data.tokenBalances);
        }
      } catch (err) {
        console.error('Failed to fetch balances', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalances();

    // Poll every 10 seconds
    const interval = setInterval(fetchBalances, 10000);
    return () => clearInterval(interval);
  }, [walletId]);

  return { balances, isLoading };
}

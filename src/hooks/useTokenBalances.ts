/**
 * Token Balance Hooks for SOLR-ARC
 * Real-time sARC and USDC balance tracking
 */

import { useState, useEffect } from 'react';
import { getSarcTokenContract, getUsdcContract } from '@/lib/circle-contracts';

/**
 * Get sARC token balance for an address
 */
export function useSARCBalance(address: string | undefined) {
  const [data, setData] = useState<bigint>(0n);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!address) return;

    const fetchBalance = async () => {
      setIsLoading(true);
      try {
        const contract = getSarcTokenContract();
        const balance = await contract.balanceOf(address);
        setData(balance);
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [address]);

  return { data, isLoading, error };
}

/**
 * Get USDC balance for an address
 */
export function useUSDCBalance(address: string | undefined) {
  const [data, setData] = useState<bigint>(0n);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!address) return;

    const fetchBalance = async () => {
      setIsLoading(true);
      try {
        const contract = getUsdcContract();
        const balance = await contract.balanceOf(address);
        setData(balance);
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [address]);

  return { data, isLoading, error };
}

/**
 * Get both balances in a single hook
 */
export function useBalances(address: string | undefined) {
  const sarcBalance = useSARCBalance(address);
  const usdcBalance = useUSDCBalance(address);

  // Manual refetch function
  const refetch = async () => {
    if (!address) return;
    
    try {
      const sarcContract = getSarcTokenContract();
      const usdcContract = getUsdcContract();
      
      const [sarcBal, usdcBal] = await Promise.all([
        sarcContract.balanceOf(address),
        usdcContract.balanceOf(address),
      ]);
      
      console.log('🔄 Balances refreshed:', {
        sarc: sarcBal.toString(),
        usdc: usdcBal.toString()
      });
    } catch (err) {
      console.error('❌ Failed to refetch balances:', err);
    }
  };

  return {
    sarc: {
      balance: sarcBalance.data || 0n,
      isLoading: sarcBalance.isLoading,
      error: sarcBalance.error,
    },
    usdc: {
      balance: usdcBalance.data || 0n,
      isLoading: usdcBalance.isLoading,
      error: usdcBalance.error,
    },
    isLoading: sarcBalance.isLoading || usdcBalance.isLoading,
    error: sarcBalance.error || usdcBalance.error,
    refetch,
  };
}

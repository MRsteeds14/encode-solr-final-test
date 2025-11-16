/**
 * Treasury Contract Hooks for SOLR-ARC
 * Manages sARC → USDC redemptions
 */

import { useState, useEffect } from 'react';
import { getTreasuryContract, getProvider } from '@/lib/circle-contracts';
import { ethers } from 'ethers';

/**
 * Calculate USDC amount for given sARC
 */
export function useCalculateRedemption(sarcAmount: bigint | undefined) {
  const [data, setData] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!sarcAmount) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const contract = getTreasuryContract();
        const result = await contract.calculateRedemptionAmount(sarcAmount);
        setData(result);
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [sarcAmount]);

  return { data, isLoading, error };
}

/**
 * Get Treasury balances
 */
export function useTreasuryBalance() {
  const [data, setData] = useState<{ sarcBalance: bigint; usdcBalance: bigint } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const contract = getTreasuryContract();
        const result = await contract.getTreasuryBalance();
        setData({ sarcBalance: result[0], usdcBalance: result[1] });
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return { data, isLoading, error };
}

/**
 * Get current exchange rate
 */
export function useExchangeRate() {
  const [data, setData] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const contract = getTreasuryContract();
        const result = await contract.usdcPerKwh();
        setData(result);
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, isLoading, error };
}

/**
 * Redeem sARC tokens for USDC
 * Note: Transaction signing handled by Circle Worker
 */
export function useRedeemForUSDC() {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<any>(null);

  const redeemForUSDC = async (sarcAmount: bigint, ipfsProof: string) => {
    setIsPending(true);
    setIsError(false);
    setError(null);

    try {
      // Note: Actual transaction signing done in App.tsx via signAndSendTransaction
      // This hook is just for state management
      setIsSuccess(true);
      return { success: true };
    } catch (err: any) {
      setIsError(true);
      setError(err);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return {
    redeemForUSDC,
    isPending,
    isSuccess,
    isError,
    error,
    transactionData: data,
  };
}

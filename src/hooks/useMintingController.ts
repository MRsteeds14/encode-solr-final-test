/**
 * MintingController Contract Hooks for SOLR-ARC
 * Manages sARC token minting operations
 */

import { useState, useEffect } from 'react';
import { getMintingControllerContract, getMintingStats as fetchMintingStats, getProducerMintingStats } from '@/lib/circle-contracts';

/**
 * Check if circuit breaker is triggered
 */
export function useCircuitBreakerStatus() {
  const [data, setData] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const contract = getMintingControllerContract();
        const result = await contract.circuitBreakerTriggered();
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
 * Get current minting statistics
 */
export function useMintingStats() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const stats = await fetchMintingStats();
        setData({
          todayMinted: stats.todayMinted,
          dailyRemaining: stats.dailyRemaining,
          allTimeMinted: stats.allTimeMinted,
          breakerStatus: stats.breakerStatus,
        });
      } catch (err: any) {
        console.error('❌ Failed to fetch minting stats:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return { data, isLoading, error };
}

/**
 * Get producer-specific minting stats
 */
export function useProducerStats(address: string | undefined) {
  const [data, setData] = useState<bigint>(0n);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!address) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const stats = await getProducerMintingStats(address);
        setData(stats.totalMinted);
      } catch (err: any) {
        console.error('❌ Failed to fetch producer stats:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [address]);

  return { data, isLoading, error };
}

/**
 * Note: Actual minting is handled by the PoG Agent (Cloudflare Worker)
 * Users call the PoG Agent API endpoint, which then calls mintFromGeneration()
 * This keeps the AI validation logic off-chain while ensuring blockchain security
 */

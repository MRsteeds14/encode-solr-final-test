/**
 * Hook to check if a wallet is registered as a solar producer
 * Returns registration status and producer data
 */

import { useState, useEffect, useCallback } from 'react';
import { getRegistryContract } from '@/lib/circle-contracts';

export interface ProducerData {
  isWhitelisted: boolean;
  systemCapacityKw: bigint;
  dailyCapKwh: bigint;
  totalMinted: bigint;
  lastMintTimestamp: bigint;
  ipfsMetadata: string;
  registrationDate: bigint;
}

/**
 * Check producer registration status and get their data
 */
export function useProducerStatus(address: string | undefined) {
  const [isRegistered, setIsRegistered] = useState(false);
  const [producerData, setProducerData] = useState<ProducerData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (retryCount = 0) => {
    if (!address) return;

    setIsLoading(true);
    try {
      const contract = getRegistryContract();
      
      // Get full producer data - returns a struct/tuple
      const result = await contract.getProducer(address);
      
      // The result is a struct with named properties
      const data: ProducerData = {
        isWhitelisted: result.isWhitelisted || result[0],
        systemCapacityKw: result.systemCapacityKw || result[1],
        dailyCapKwh: result.dailyCapKwh || result[2],
        totalMinted: result.totalMinted || result[3],
        lastMintTimestamp: result.lastMintTimestamp || result[4],
        ipfsMetadata: result.ipfsMetadata || result[5] || '',
        registrationDate: result.registrationDate || result[6],
      };

      setProducerData(data);
      setIsRegistered(data.isWhitelisted);
      setError(null); // Clear any previous errors
      
      console.log('🔍 Producer status for', address, ':', data);
    } catch (err: any) {
      console.error('❌ Failed to fetch producer status (attempt', retryCount + 1, '):', err);
      
      // Retry with exponential backoff (max 3 attempts)
      if (retryCount < 2) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`⏳ Retrying in ${delay}ms...`);
        setTimeout(() => fetchData(retryCount + 1), delay);
      } else {
        setError(err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    isRegistered,
    producerData,
    isLoading,
    error,
    refetch: fetchData,
  };
}

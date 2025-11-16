/**
 * Registry Contract Hooks for SOLR-ARC
 * Manages solar producer registration and validation
 */

import { useState, useEffect } from 'react';
import { getRegistryContract } from '@/lib/circle-contracts';

/**
 * Check if an address is whitelisted as a solar producer
 */
export function useIsWhitelisted(address: string | undefined) {
  const [data, setData] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!address) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const contract = getRegistryContract();
        const result = await contract.isWhitelisted(address);
        setData(result);
      } catch (err: any) {
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
 * Get full producer profile
 */
export function useProducerProfile(address: string | undefined) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!address) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const contract = getRegistryContract();
        const result = await contract.getProducer(address);
        setData({
          isWhitelisted: result[0],
          systemCapacityKw: result[1],
          dailyCapKwh: result[2],
          totalMinted: result[3],
          lastMintTimestamp: result[4],
          ipfsMetadata: result[5],
          registrationDate: result[6],
        });
      } catch (err: any) {
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
 * Validate if a production amount is within daily limits
 */
export function useValidateDailyProduction(
  address: string | undefined,
  kwhAmount: bigint | undefined
) {
  const [data, setData] = useState<{ isValid: boolean; reason: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!address || !kwhAmount) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const contract = getRegistryContract();
        const result = await contract.validateDailyProduction(address, kwhAmount);
        setData({ isValid: result[0], reason: result[1] });
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [address, kwhAmount]);

  return { data, isLoading, error };
}

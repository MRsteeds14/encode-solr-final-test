/**
 * Hook to register a new solar producer
 * Uses Circle Developer-Controlled Wallets
 */

import { useState } from 'react';
import { signAndSendTransaction } from '@/lib/circle-contracts';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';
import { useCircleWallet } from './useCircleWallet';

export function useRegisterProducer() {
  const { wallet } = useCircleWallet();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<any>(null);

  const register = async (
    producerAddress: string,
    systemCapacityKw: number,
    dailyCapKwh: number,
    ipfsMetadata: string = ''
  ) => {
    if (!wallet) {
      throw new Error('Wallet not connected');
    }

    setIsPending(true);
    setIsError(false);
    setError(null);

    try {
      const result = await signAndSendTransaction(
        wallet.id,
        CONTRACT_ADDRESSES.REGISTRY,
        'registerProducer',
        [
          producerAddress,
          BigInt(systemCapacityKw),
          BigInt(dailyCapKwh),
          ipfsMetadata,
        ]
      );

      setData(result);
      setIsSuccess(true);
      return result;
    } catch (err: any) {
      setIsError(true);
      setError(err);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return {
    register,
    isPending,
    isSuccess,
    isError,
    error,
    data,
  };
}

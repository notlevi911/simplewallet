'use client';

import React from 'react';
import { useReadContract, useAccount } from 'wagmi';
import { EERC_CONTRACT } from '../lib/contracts';
import { avalancheFuji } from 'wagmi/chains';
import { useSignMessage } from 'wagmi';
import { getDecryptedBalance, i0 } from '../lib/balances/balances';

export function useEncryptedBalance() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const { data: encryptedBalance, isLoading, error } = useReadContract({
    address: EERC_CONTRACT.address,
    abi: EERC_CONTRACT.abi,
    functionName: 'getBalanceFromTokenAddress',
    args: address ? [address, address] : undefined,
    chainId: avalancheFuji.id,
    query: {
      enabled: !!address,
    },
  });

  const [decryptedBalance, setDecryptedBalance] = React.useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = React.useState(false);
  const [decryptError, setDecryptError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (encryptedBalance && address) {
      const decryptBalance = async () => {
        try {
          setIsDecrypting(true);
          setDecryptError(null);
          
          const message = `Decrypt balance for ${address}`;
          const signature = await signMessageAsync({ message });
          
          const privateKey = i0(signature);
          const balance = await getDecryptedBalance(privateKey, [], [], encryptedBalance as any);
          setDecryptedBalance(balance.toString());
        } catch (err) {
          console.error('Error decrypting balance:', err);
          setDecryptError(err instanceof Error ? err.message : 'Failed to decrypt balance');
        } finally {
          setIsDecrypting(false);
        }
      };

      decryptBalance();
    }
  }, [encryptedBalance, address, signMessageAsync]);

  const formattedEncryptedBalance = decryptedBalance ? 
    `${parseFloat(decryptedBalance).toFixed(4)} eAVAX` : 
    '0.0000 eAVAX';

  return {
    encryptedBalance,
    decryptedBalance,
    formattedEncryptedBalance,
    isLoading: isLoading || isDecrypting,
    error: error || decryptError,
  };
}
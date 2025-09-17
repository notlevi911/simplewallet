'use client';

import { useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ERC20_TEST } from '../lib/contracts';
import { avalancheFuji } from 'wagmi/chains';
import { useAccount } from 'wagmi';

export function useERC20() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending: isWritePending, error: writeError } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const { data: contractData, isLoading, error } = useReadContracts({
    contracts: [
      {
        address: ERC20_TEST.address,
        abi: ERC20_TEST.abi,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        chainId: avalancheFuji.id,
      },
      {
        address: ERC20_TEST.address,
        abi: ERC20_TEST.abi,
        functionName: 'canClaimFromFaucet',
        args: address ? [address] : undefined,
        chainId: avalancheFuji.id,
      },
    ],
    query: {
      enabled: !!address,
    },
  });

  const [balance, canClaim] = contractData || [];

  const claimFromFaucet = async () => {
    try {
      await writeContract({
        address: ERC20_TEST.address,
        abi: ERC20_TEST.abi,
        functionName: 'claimFromFaucet',
        args: [],
        chainId: avalancheFuji.id,
      });
    } catch (error) {
      console.error('Error claiming from faucet:', error);
      throw error;
    }
  };

  const approveTokens = async (spender: `0x${string}`, amount: bigint) => {
    try {
      await writeContract({
        address: ERC20_TEST.address,
        abi: ERC20_TEST.abi,
        functionName: 'approve',
        args: [spender, amount],
        chainId: avalancheFuji.id,
      });
    } catch (error) {
      console.error('Error approving tokens:', error);
      throw error;
    }
  };

  return {
    balance: balance?.result as bigint | undefined,
    canClaim: canClaim?.result as boolean | undefined,
    claimFromFaucet,
    approveTokens,
    isLoading,
    error,
    isPending: isWritePending,
    isConfirming,
    isConfirmed,
    writeError,
    hash,
  };
}
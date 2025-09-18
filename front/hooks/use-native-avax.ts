"use client";

import { useAccount, useBalance } from "wagmi";
import { avalancheFuji } from "wagmi/chains";

export function useNativeAVAX() {
  const { address } = useAccount();
  
  const { data: balance, isLoading, error } = useBalance({
    address,
    chainId: avalancheFuji.id,
  });

  return {
    balance: balance ? balance.formatted : "0",
    balanceRaw: balance?.value || 0n,
    isLoading,
    error,
    symbol: "AVAX",
    decimals: 18,
  };
}

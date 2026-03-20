import { useMemo } from 'react';
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { formatUnits, parseUnits, type Address, isAddress } from 'viem';
import {
  IDO_CONTRACT_ADDRESS,
  USDT_CONTRACT_ADDRESS,
  isContractsConfigured,
} from '../config/contracts';

// Mock IDO Contract ABI (simplified)
const IDO_ABI = [
  {
    name: 'getCurrentPrice',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'currentTier',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'totalSold',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'totalUsdtCollected',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'purchased',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'claimed',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ type: 'address' }],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'createInvoice',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { type: 'string', name: 'invoiceId' },
      { type: 'uint256', name: 'usdtAmount' },
      { type: 'uint256', name: 'tokenAmount' },
      { type: 'uint256', name: 'expiryDate' },
      { type: 'address', name: 'recipientWallet' },
      { type: 'string', name: 'notes' },
    ],
    outputs: [],
  },
  {
    name: 'simulateBuyWithUSDT',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ type: 'uint256', name: 'usdtAmount' }],
    outputs: [
      { type: 'uint256', name: 'totalTokens' },
      { type: 'uint256', name: 'finalTier' },
      { type: 'uint256[]', name: 'tierAmounts' },
      { type: 'uint256[]', name: 'tierPrices' },
      { type: 'uint256', name: 'totalUsdtUsed' },
    ],
  },
  {
    name: 'buy',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { type: 'uint256', name: 'desiredTokens' },
      { type: 'uint256', name: 'maxUsdtAllowed' },
    ],
    outputs: [],
  },
  {
    name: 'payInvoice',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { type: 'string', name: 'invoiceId' },
      { type: 'uint256', name: 'maxUsdtAllowed' },
    ],
    outputs: [],
  },
  {
    name: 'claim',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
] as const;

const USDT_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ type: 'address' }, { type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ type: 'address' }, { type: 'uint256' }],
    outputs: [{ type: 'bool' }],
  },
] as const;

export interface IdoStats {
  currentPrice: string;
  currentTier: number;
  totalSold: string;
  totalUsdtCollected: string;
  userPurchased: string;
  userClaimed: boolean;
  usdtBalance: string;
  usdtAllowance: string;
}

export const useIdoContract = () => {
  const { address, isConnected } = useAccount();
  const { writeContract } = useWriteContract();
  const publicClient = usePublicClient();
  const account = (address ?? '0x0000000000000000000000000000000000000000') as Address;

  const { data: currentPriceRaw } = useReadContract({
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ABI,
    functionName: 'getCurrentPrice',
    query: { enabled: isContractsConfigured },
  });

  const { data: currentTierRaw } = useReadContract({
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ABI,
    functionName: 'currentTier',
    query: { enabled: isContractsConfigured },
  });

  const { data: totalSoldRaw } = useReadContract({
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ABI,
    functionName: 'totalSold',
    query: { enabled: isContractsConfigured },
  });

  const { data: totalUsdtCollectedRaw } = useReadContract({
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ABI,
    functionName: 'totalUsdtCollected',
    query: { enabled: isContractsConfigured },
  });

  const { data: userPurchasedRaw } = useReadContract({
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ABI,
    functionName: 'purchased',
    args: [account],
    query: { enabled: isContractsConfigured && Boolean(address) },
  });

  const { data: userClaimedRaw } = useReadContract({
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ABI,
    functionName: 'claimed',
    args: [account],
    query: { enabled: isContractsConfigured && Boolean(address) },
  });

  const { data: usdtBalanceRaw } = useReadContract({
    address: USDT_CONTRACT_ADDRESS,
    abi: USDT_ABI,
    functionName: 'balanceOf',
    args: [account],
    query: { enabled: isContractsConfigured && Boolean(address) },
  });

  const { data: usdtAllowanceRaw } = useReadContract({
    address: USDT_CONTRACT_ADDRESS,
    abi: USDT_ABI,
    functionName: 'allowance',
    args: [account, IDO_CONTRACT_ADDRESS],
    query: { enabled: isContractsConfigured && Boolean(address) },
  });

  const stats = useMemo<IdoStats>(
    () => ({
      currentPrice: currentPriceRaw ? formatUnits(currentPriceRaw, 6) : '0',
      currentTier: Number(currentTierRaw ?? 0n),
      totalSold: totalSoldRaw ? formatUnits(totalSoldRaw, 18) : '0',
      totalUsdtCollected: totalUsdtCollectedRaw ? formatUnits(totalUsdtCollectedRaw, 6) : '0',
      userPurchased: userPurchasedRaw ? formatUnits(userPurchasedRaw, 18) : '0',
      userClaimed: Boolean(userClaimedRaw ?? false),
      usdtBalance: usdtBalanceRaw ? formatUnits(usdtBalanceRaw, 6) : '0',
      usdtAllowance: usdtAllowanceRaw ? formatUnits(usdtAllowanceRaw, 6) : '0',
    }),
    [
      currentPriceRaw,
      currentTierRaw,
      totalSoldRaw,
      totalUsdtCollectedRaw,
      userPurchasedRaw,
      userClaimedRaw,
      usdtBalanceRaw,
      usdtAllowanceRaw,
    ],
  );

  const approveUsdt = async (amount: string) => {
    if (!address) throw new Error('Wallet not connected');
    if (!isContractsConfigured) throw new Error('Contract addresses are not configured');
    
    try {
      const hash = await writeContract({
        address: USDT_CONTRACT_ADDRESS,
        abi: USDT_ABI,
        functionName: 'approve',
        args: [IDO_CONTRACT_ADDRESS, parseUnits(amount, 6)],
      });
      return hash;
    } catch (error) {
      console.error('Approve failed:', error);
      throw error;
    }
  };

  const buyTokens = async (usdtAmount: string) => {
    if (!address) throw new Error('Wallet not connected');
    if (!isContractsConfigured) throw new Error('Contract addresses are not configured');
    if (!publicClient) throw new Error('Public client not available');
    
    try {
      const usdtAmountInUnits = parseUnits(usdtAmount, 6);
      const simulation = await publicClient.readContract({
        address: IDO_CONTRACT_ADDRESS,
        abi: IDO_ABI,
        functionName: 'simulateBuyWithUSDT',
        args: [usdtAmountInUnits],
      });

      const [desiredTokens] = simulation;
      if (desiredTokens <= 0n) {
        throw new Error('No tokens can be purchased for this USDT amount');
      }

      const hash = await writeContract({
        address: IDO_CONTRACT_ADDRESS,
        abi: IDO_ABI,
        functionName: 'buy',
        args: [desiredTokens, usdtAmountInUnits],
      });
      return hash;
    } catch (error) {
      console.error('Buy failed:', error);
      throw error;
    }
  };

  const claimTokens = async () => {
    if (!address) throw new Error('Wallet not connected');
    if (!isContractsConfigured) throw new Error('Contract addresses are not configured');
    
    try {
      const hash = await writeContract({
        address: IDO_CONTRACT_ADDRESS,
        abi: IDO_ABI,
        functionName: 'claim',
      });
      return hash;
    } catch (error) {
      console.error('Claim failed:', error);
      throw error;
    }
  };

  const payInvoice = async (invoiceId: string, usdtAmount: string) => {
    if (!address) throw new Error('Wallet not connected');
    if (!isContractsConfigured) throw new Error('Contract addresses are not configured');

    try {
      const maxUsdtAllowed = parseUnits(usdtAmount, 6);
      const hash = await writeContract({
        address: IDO_CONTRACT_ADDRESS,
        abi: IDO_ABI,
        functionName: 'payInvoice',
        args: [invoiceId, maxUsdtAllowed],
      });
      return hash;
    } catch (error) {
      console.error('Pay invoice failed:', error);
      throw error;
    }
  };

  const createInvoice = async (params: {
    invoiceId: string;
    usdtAmount: string;
    tokenAmount: string;
    expiryDate: string;
    recipientWallet?: string;
    notes?: string;
  }) => {
    if (!address) throw new Error('Wallet not connected');
    if (!isContractsConfigured) throw new Error('Contract addresses are not configured');

    const recipient = params.recipientWallet?.trim();
    if (recipient && !isAddress(recipient)) {
      throw new Error('Invalid recipient wallet address');
    }

    const expiryTimestamp = Math.floor(new Date(params.expiryDate).getTime() / 1000);
    if (!Number.isFinite(expiryTimestamp) || expiryTimestamp <= 0) {
      throw new Error('Invalid expiry date');
    }

    try {
      const hash = await writeContract({
        address: IDO_CONTRACT_ADDRESS,
        abi: IDO_ABI,
        functionName: 'createInvoice',
        args: [
          params.invoiceId,
          parseUnits(params.usdtAmount, 6),
          parseUnits(params.tokenAmount, 18),
          BigInt(expiryTimestamp),
          (recipient || '0x0000000000000000000000000000000000000000') as Address,
          params.notes || '',
        ],
      });
      return hash;
    } catch (error) {
      console.error('Create invoice failed:', error);
      throw error;
    }
  };

  const simulateBuy = (usdtAmount: string) => {
    const usdtValue = parseFloat(usdtAmount || '0');
    const priceValue = parseFloat(stats.currentPrice || '0');
    const tokens = priceValue > 0 ? usdtValue / priceValue : 0;

    return {
      usdtAmount,
      tokensReceived: tokens.toFixed(2),
      pricePerToken: stats.currentPrice,
    };
  };

  return {
    stats,
    approveUsdt,
    buyTokens,
    payInvoice,
    createInvoice,
    claimTokens,
    simulateBuy,
  };
};

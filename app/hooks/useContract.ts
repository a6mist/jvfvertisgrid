import { useEffect, useMemo, useState } from 'react';
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { formatUnits, parseUnits, type Address, isAddress, parseAbiItem } from 'viem';
import {
  IDO_CONTRACT_ADDRESS,
  USDT_CONTRACT_ADDRESS,
  isContractsConfigured,
} from '../config/contracts';
import { isTronMode } from '../config/network';
import { useWallet } from '../context/WalletContext';

const READ_CHAIN_ID = 1;

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
    name: 'totalParticipants',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'START_PRICE',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'PRICE_INCREMENT',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'USDT_PER_TIER',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'MAX_TOKENS',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'isBuyPaused',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'startTime',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'endTime',
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
    name: 'getAdmins',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address[]' }],
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
    name: 'simulateBuy',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ type: 'uint256', name: 'desiredTokens' }],
    outputs: [
      { type: 'uint256', name: 'totalCost' },
      { type: 'uint256', name: 'finalTier' },
      { type: 'uint256[]', name: 'tierAmounts' },
      { type: 'uint256[]', name: 'tierPrices' },
    ],
  },
  {
    name: 'buyWithExactUSDT',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ type: 'uint256', name: 'usdtAmount' }],
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
    name: 'getInvoice',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ type: 'string', name: 'invoiceId' }],
    outputs: [
      { type: 'bool', name: 'exists' },
      { type: 'bool', name: 'paid' },
      { type: 'string', name: 'invoiceId' },
      { type: 'uint256', name: 'usdtAmount' },
      { type: 'uint256', name: 'tokenAmount' },
      { type: 'uint256', name: 'expiryDate' },
      { type: 'address', name: 'recipientWallet' },
      { type: 'string', name: 'notes' },
      { type: 'address', name: 'payer' },
      { type: 'uint256', name: 'paidAt' },
      { type: 'uint256', name: 'usdtSpent' },
    ],
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
  totalParticipants: number;
  startPrice: string;
  priceIncrement: string;
  usdtPerTier: string;
  maxTokens: string;
  userPurchased: string;
  userClaimed: boolean;
  usdtBalance: string;
  usdtAllowance: string;
}

export interface PortfolioActivityItem {
  type: 'purchase' | 'claim';
  amount: string;
  usdtAmount?: string;
  txHash: string;
  timestamp: number;
}

export interface OnChainInvoice {
  exists: boolean;
  paid: boolean;
  invoiceId: string;
  usdtAmount: string;
  tokenAmount: string;
  expiryDate: number;
  recipientWallet: string;
  notes: string;
  payer: string;
  paidAt: number;
  usdtSpent: string;
}

const TOKENS_PURCHASED_EVENT = parseAbiItem(
  'event TokensPurchased(address indexed buyer, uint256 tokenAmount, uint256 usdtSpent)',
);
const TOKENS_CLAIMED_EVENT = parseAbiItem(
  'event TokensClaimed(address indexed claimer, uint256 amount)',
);
const INVOICE_CREATED_EVENT = parseAbiItem(
  'event InvoiceCreated(bytes32 indexed invoiceKey, string invoiceId, uint256 usdtAmount, uint256 tokenAmount, uint256 expiryDate, address indexed recipientWallet)',
);
const INVOICE_PAID_EVENT = parseAbiItem(
  'event InvoicePaid(bytes32 indexed invoiceKey, string invoiceId, address indexed payer, uint256 tokenAmount, uint256 usdtSpent)',
);

const extractErrorMessage = (error: unknown): string => {
  const seen = new Set<unknown>();
  const queue: unknown[] = [error];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== 'object' || seen.has(current)) continue;
    seen.add(current);

    const candidate = current as {
      shortMessage?: unknown;
      reason?: unknown;
      details?: unknown;
      message?: unknown;
      cause?: unknown;
      data?: unknown;
    };

    for (const key of ['shortMessage', 'reason', 'details', 'message'] as const) {
      const value = candidate[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }

    if (candidate.cause) queue.push(candidate.cause);
    if (candidate.data) queue.push(candidate.data);
  }

  return 'Transaction simulation failed. Check invoice status, allowance, balance, and network.';
};

const GET_INVOICE_TUPLE_ABI = [
  {
    name: 'getInvoice',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ type: 'string', name: 'invoiceId' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { type: 'bool', name: 'exists' },
          { type: 'bool', name: 'paid' },
          { type: 'string', name: 'invoiceId' },
          { type: 'uint256', name: 'usdtAmount' },
          { type: 'uint256', name: 'tokenAmount' },
          { type: 'uint256', name: 'expiryDate' },
          { type: 'address', name: 'recipientWallet' },
          { type: 'string', name: 'notes' },
          { type: 'address', name: 'payer' },
          { type: 'uint256', name: 'paidAt' },
          { type: 'uint256', name: 'usdtSpent' },
        ],
      },
    ],
  },
] as const;

const PAY_INVOICE_LEGACY_ABI = [
  {
    name: 'payInvoice',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ type: 'string', name: 'invoiceId' }],
    outputs: [],
  },
] as const;

const TRON_ZERO_ADDRESS_BASE58 = 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb';

const toBigIntSafe = (value: unknown): bigint => {
  try {
    if (typeof value === 'bigint') return value;
    if (typeof value === 'number') return BigInt(Math.trunc(value));
    if (typeof value === 'string') return BigInt(value);
    if (value && typeof (value as { toString?: () => string }).toString === 'function') {
      return BigInt((value as { toString: () => string }).toString());
    }
  } catch {
    return 0n;
  }

  return 0n;
};

const toBoolSafe = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') return value === 'true' || value === '1';
  return Boolean(value);
};

const normalizeTronAddress = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const isZeroAddressLike = (value: string): boolean => {
  const lower = value.toLowerCase();
  return (
    !value ||
    lower === '0x0000000000000000000000000000000000000000' ||
    value === TRON_ZERO_ADDRESS_BASE58
  );
};

const getTronWeb = () => (window as any)?.tronWeb;
const LOG_BLOCK_CHUNK_SIZE = 40_000n;
const MIN_LOG_BLOCK_CHUNK_SIZE = 1_000n;
const DEFAULT_LOG_LOOKBACK_BLOCKS = 500_000n;

const configuredDeploymentBlock = (() => {
  const value = (import.meta as unknown as { env?: Record<string, string | undefined> }).env
    ?.VITE_IDO_DEPLOYMENT_BLOCK;
  if (!value) return null;

  try {
    const parsed = BigInt(value);
    return parsed >= 0n ? parsed : null;
  } catch {
    return null;
  }
})();

const isUserRejectedError = (error: unknown): boolean => {
  const message = extractErrorMessage(error).toLowerCase();
  return (
    message.includes('user rejected') ||
    message.includes('user denied') ||
    message.includes('denied transaction signature') ||
    message.includes('rejected the request')
  );
};

const isBlockRangeLimitError = (error: unknown): boolean => {
  const message = extractErrorMessage(error).toLowerCase();
  return (
    message.includes('maximum block range') ||
    message.includes('max block range') ||
    message.includes('block range')
  );
};

export const useIdoContract = () => {
  const { address: evmAddress } = useAccount();
  const { address: tronAddress } = useWallet();
  const address = isTronMode ? tronAddress : evmAddress;
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const readClient = usePublicClient({ chainId: READ_CHAIN_ID });
  const account = (address ?? '0x0000000000000000000000000000000000000000') as Address;
  const [tronStats, setTronStats] = useState<IdoStats>({
    currentPrice: '0',
    currentTier: 0,
    totalSold: '0',
    totalUsdtCollected: '0',
    totalParticipants: 0,
    startPrice: '0',
    priceIncrement: '0',
    usdtPerTier: '0',
    maxTokens: '0',
    userPurchased: '0',
    userClaimed: false,
    usdtBalance: '0',
    usdtAllowance: '0',
  });

  const { data: currentPriceRaw } = useReadContract({
    chainId: READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ABI,
    functionName: 'getCurrentPrice',
    query: { enabled: !isTronMode && isContractsConfigured },
  });

  const { data: currentTierRaw } = useReadContract({
    chainId: READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ABI,
    functionName: 'currentTier',
    query: { enabled: !isTronMode && isContractsConfigured },
  });

  const { data: totalSoldRaw } = useReadContract({
    chainId: READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ABI,
    functionName: 'totalSold',
    query: { enabled: !isTronMode && isContractsConfigured },
  });

  const { data: totalUsdtCollectedRaw } = useReadContract({
    chainId: READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ABI,
    functionName: 'totalUsdtCollected',
    query: { enabled: !isTronMode && isContractsConfigured },
  });

  const { data: totalParticipantsRaw } = useReadContract({
    chainId: READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ABI,
    functionName: 'totalParticipants',
    query: { enabled: !isTronMode && isContractsConfigured },
  });

  const { data: startPriceRaw } = useReadContract({
    chainId: READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ABI,
    functionName: 'START_PRICE',
    query: { enabled: !isTronMode && isContractsConfigured },
  });

  const { data: priceIncrementRaw } = useReadContract({
    chainId: READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ABI,
    functionName: 'PRICE_INCREMENT',
    query: { enabled: !isTronMode && isContractsConfigured },
  });

  const { data: usdtPerTierRaw } = useReadContract({
    chainId: READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ABI,
    functionName: 'USDT_PER_TIER',
    query: { enabled: !isTronMode && isContractsConfigured },
  });

  const { data: maxTokensRaw } = useReadContract({
    chainId: READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ABI,
    functionName: 'MAX_TOKENS',
    query: { enabled: !isTronMode && isContractsConfigured },
  });

  const { data: userPurchasedRaw } = useReadContract({
    chainId: READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ABI,
    functionName: 'purchased',
    args: [account],
    query: { enabled: !isTronMode && isContractsConfigured && Boolean(address) },
  });

  const { data: userClaimedRaw } = useReadContract({
    chainId: READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ABI,
    functionName: 'claimed',
    args: [account],
    query: { enabled: !isTronMode && isContractsConfigured && Boolean(address) },
  });

  const { data: usdtBalanceRaw } = useReadContract({
    chainId: READ_CHAIN_ID,
    address: USDT_CONTRACT_ADDRESS,
    abi: USDT_ABI,
    functionName: 'balanceOf',
    args: [account],
    query: {
      enabled: !isTronMode && isContractsConfigured && Boolean(address),
      refetchInterval: 5000,
    },
  });

  const { data: usdtAllowanceRaw } = useReadContract({
    chainId: READ_CHAIN_ID,
    address: USDT_CONTRACT_ADDRESS,
    abi: USDT_ABI,
    functionName: 'allowance',
    args: [account, IDO_CONTRACT_ADDRESS],
    query: {
      enabled: !isTronMode && isContractsConfigured && Boolean(address),
      refetchInterval: 3000,
    },
  });

  useEffect(() => {
    if (!isTronMode || !isContractsConfigured) return;

    let isMounted = true;

    const loadTronStats = async () => {
      const tronWeb = getTronWeb();
      if (!tronWeb) return;

      try {
        const ido = await tronWeb.contract().at(IDO_CONTRACT_ADDRESS);
        const usdt = await tronWeb.contract().at(USDT_CONTRACT_ADDRESS);

        const [
          currentPrice,
          currentTier,
          totalSold,
          totalUsdtCollected,
          totalParticipants,
          startPrice,
          priceIncrement,
          usdtPerTier,
          maxTokens,
        ] = await Promise.all([
          ido.getCurrentPrice().call(),
          ido.currentTier().call(),
          ido.totalSold().call(),
          ido.totalUsdtCollected().call(),
          ido.totalParticipants().call(),
          ido.START_PRICE().call(),
          ido.PRICE_INCREMENT().call(),
          ido.USDT_PER_TIER().call(),
          ido.MAX_TOKENS().call(),
        ]);

        let userPurchased = 0n;
        let userClaimed = false;
        let usdtBalance = 0n;
        let usdtAllowance = 0n;

        if (address) {
          const [purchasedRaw, claimedRaw, balanceRaw, allowanceRaw] = await Promise.all([
            ido.purchased(address).call(),
            ido.claimed(address).call(),
            usdt.balanceOf(address).call(),
            usdt.allowance(address, IDO_CONTRACT_ADDRESS).call(),
          ]);

          userPurchased = toBigIntSafe(purchasedRaw);
          userClaimed = toBoolSafe(claimedRaw);
          usdtBalance = toBigIntSafe(balanceRaw);
          usdtAllowance = toBigIntSafe(allowanceRaw);
        }

        if (!isMounted) return;

        setTronStats({
          currentPrice: formatUnits(toBigIntSafe(currentPrice), 6),
          currentTier: Number(toBigIntSafe(currentTier)),
          totalSold: formatUnits(toBigIntSafe(totalSold), 18),
          totalUsdtCollected: formatUnits(toBigIntSafe(totalUsdtCollected), 6),
          totalParticipants: Number(toBigIntSafe(totalParticipants)),
          startPrice: formatUnits(toBigIntSafe(startPrice), 6),
          priceIncrement: formatUnits(toBigIntSafe(priceIncrement), 6),
          usdtPerTier: formatUnits(toBigIntSafe(usdtPerTier), 6),
          maxTokens: formatUnits(toBigIntSafe(maxTokens), 18),
          userPurchased: formatUnits(userPurchased, 18),
          userClaimed,
          usdtBalance: formatUnits(usdtBalance, 6),
          usdtAllowance: formatUnits(usdtAllowance, 6),
        });
      } catch (error) {
        console.error('Failed to load TRON stats:', error);
      }
    };

    void loadTronStats();
    const timer = window.setInterval(() => void loadTronStats(), 5000);

    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, [address]);

  const stats = useMemo<IdoStats>(() => {
    if (isTronMode) return tronStats;

    return {
      currentPrice: currentPriceRaw ? formatUnits(currentPriceRaw, 6) : '0',
      currentTier: Number(currentTierRaw ?? 0n),
      totalSold: totalSoldRaw ? formatUnits(totalSoldRaw, 18) : '0',
      totalUsdtCollected: totalUsdtCollectedRaw ? formatUnits(totalUsdtCollectedRaw, 6) : '0',
      totalParticipants: Number(totalParticipantsRaw ?? 0n),
      startPrice: startPriceRaw ? formatUnits(startPriceRaw, 6) : '0',
      priceIncrement: priceIncrementRaw ? formatUnits(priceIncrementRaw, 6) : '0',
      usdtPerTier: usdtPerTierRaw ? formatUnits(usdtPerTierRaw, 6) : '0',
      maxTokens: maxTokensRaw ? formatUnits(maxTokensRaw, 18) : '0',
      userPurchased: userPurchasedRaw ? formatUnits(userPurchasedRaw, 18) : '0',
      userClaimed: Boolean(userClaimedRaw ?? false),
      usdtBalance: usdtBalanceRaw ? formatUnits(usdtBalanceRaw, 6) : '0',
      usdtAllowance: usdtAllowanceRaw ? formatUnits(usdtAllowanceRaw, 6) : '0',
    };
  }, [
    tronStats,
    currentPriceRaw,
    currentTierRaw,
    totalSoldRaw,
    totalUsdtCollectedRaw,
    totalParticipantsRaw,
    startPriceRaw,
    priceIncrementRaw,
    usdtPerTierRaw,
    maxTokensRaw,
    userPurchasedRaw,
    userClaimedRaw,
    usdtBalanceRaw,
    usdtAllowanceRaw,
  ]);

  const getLogsInChunks = async (params: {
    event: any;
    args?: Record<string, unknown>;
    fromBlock?: bigint;
    toBlock?: bigint | 'latest';
  }) => {
    if (!readClient) return [] as any[];

    const endBlock =
      params.toBlock === undefined || params.toBlock === 'latest'
        ? await readClient.getBlockNumber()
        : params.toBlock;

    const requestedStart = params.fromBlock ?? 0n;
    const fallbackStart =
      endBlock > DEFAULT_LOG_LOOKBACK_BLOCKS ? endBlock - DEFAULT_LOG_LOOKBACK_BLOCKS : 0n;
    const boundedDefaultStart = configuredDeploymentBlock ?? fallbackStart;
    const startBlock = requestedStart === 0n ? boundedDefaultStart : requestedStart;

    if (endBlock < startBlock) return [] as any[];

    const logs: any[] = [];
    let chunkStart = startBlock;
    let chunkSize = LOG_BLOCK_CHUNK_SIZE;

    while (chunkStart <= endBlock) {
      const chunkEnd =
        chunkStart + chunkSize - 1n > endBlock
          ? endBlock
          : chunkStart + chunkSize - 1n;

      try {
        const chunkLogs = await readClient.getLogs({
          address: IDO_CONTRACT_ADDRESS,
          event: params.event,
          args: params.args as any,
          fromBlock: chunkStart,
          toBlock: chunkEnd,
        });

        logs.push(...chunkLogs);
        chunkStart = chunkEnd + 1n;
      } catch (error) {
        if (isBlockRangeLimitError(error) && chunkSize > MIN_LOG_BLOCK_CHUNK_SIZE) {
          chunkSize = chunkSize / 2n;
          if (chunkSize < MIN_LOG_BLOCK_CHUNK_SIZE) {
            chunkSize = MIN_LOG_BLOCK_CHUNK_SIZE;
          }
          continue;
        }

        throw error;
      }
    }

    return logs;
  };

  const approveUsdt = async (amount: string) => {
    if (!address) throw new Error('Wallet not connected');
    if (!isContractsConfigured) throw new Error('Contract addresses are not configured');
    if (!isTronMode && !readClient) throw new Error('Read client not available');

    if (isTronMode) {
      try {
        const tronWeb = getTronWeb();
        if (!tronWeb) throw new Error('TronWeb not available. Open TronLink and reconnect.');

        const usdt = await tronWeb.contract().at(USDT_CONTRACT_ADDRESS);
        const targetAllowance = parseUnits(amount, 6);
        const currentAllowance = toBigIntSafe(await usdt.allowance(address, IDO_CONTRACT_ADDRESS).call());

        if (currentAllowance >= targetAllowance) {
          return null;
        }

        if (currentAllowance > 0n && targetAllowance > 0n) {
          await usdt.approve(IDO_CONTRACT_ADDRESS, '0').send();
        }

        const txId = await usdt.approve(IDO_CONTRACT_ADDRESS, targetAllowance.toString()).send();
        return String(txId);
      } catch (error) {
        console.error('TRON approve failed:', error);
        throw new Error(extractErrorMessage(error));
      }
    }
    
    try {
      const targetAllowance = parseUnits(amount, 6);
      const currentAllowance = (await readClient.readContract({
        address: USDT_CONTRACT_ADDRESS,
        abi: USDT_ABI,
        functionName: 'allowance',
        args: [address as Address, IDO_CONTRACT_ADDRESS],
      })) as bigint;

      if (currentAllowance >= targetAllowance) {
        return null;
      }

      // USDT-style tokens can reject non-zero -> non-zero approve updates.
      if (currentAllowance > 0n && targetAllowance > 0n) {
        const resetHash = await writeContractAsync({
          address: USDT_CONTRACT_ADDRESS,
          abi: USDT_ABI,
          functionName: 'approve',
          args: [IDO_CONTRACT_ADDRESS, 0n],
        });

        const resetReceipt = await readClient.waitForTransactionReceipt({ hash: resetHash });
        if (resetReceipt.status !== 'success') {
          throw new Error('USDT allowance reset transaction failed on-chain');
        }
      }

      const hash = await writeContractAsync({
        address: USDT_CONTRACT_ADDRESS,
        abi: USDT_ABI,
        functionName: 'approve',
        args: [IDO_CONTRACT_ADDRESS, targetAllowance],
      });

      const receipt = await readClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== 'success') {
        throw new Error('USDT approval transaction failed on-chain');
      }
      return hash;
    } catch (error) {
      console.error('Approve failed:', error);
      throw new Error(extractErrorMessage(error));
    }
  };

  const buyTokens = async (usdtAmount: string) => {
    if (!address) throw new Error('Wallet not connected');
    if (!isContractsConfigured) throw new Error('Contract addresses are not configured');
    if (!isTronMode && !readClient) throw new Error('Read client not available');

    if (isTronMode) {
      try {
        const tronWeb = getTronWeb();
        if (!tronWeb) throw new Error('TronWeb not available. Open TronLink and reconnect.');

        const ido = await tronWeb.contract().at(IDO_CONTRACT_ADDRESS);
        const usdtAmountInUnits = parseUnits(usdtAmount, 6);
        const simulation = await ido.simulateBuyWithUSDT(usdtAmountInUnits.toString()).call();

        const desiredTokens = toBigIntSafe(
          (simulation as any)?.totalTokens ?? (Array.isArray(simulation) ? simulation[0] : simulation),
        );
        if (desiredTokens <= 0n) {
          throw new Error('No tokens can be purchased for this USDT amount');
        }

        const txId = await ido.buyWithExactUSDT(usdtAmountInUnits.toString()).send();
        return String(txId);
      } catch (error) {
        console.error('TRON buy failed:', error);
        throw error;
      }
    }
    
    try {
      const usdtAmountInUnits = parseUnits(usdtAmount, 6);
      const simulation = await readClient.readContract({
        address: IDO_CONTRACT_ADDRESS,
        abi: IDO_ABI,
        functionName: 'simulateBuyWithUSDT',
        args: [usdtAmountInUnits],
      });

      const [desiredTokens] = simulation;
      if (desiredTokens <= 0n) {
        throw new Error('No tokens can be purchased for this USDT amount');
      }

      const hash = await writeContractAsync({
        address: IDO_CONTRACT_ADDRESS,
        abi: IDO_ABI,
        functionName: 'buyWithExactUSDT',
        args: [usdtAmountInUnits],
      });

      const receipt = await readClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== 'success') {
        throw new Error('Purchase transaction failed on-chain');
      }

      return hash;
    } catch (error) {
      console.error('Buy failed:', error);
      throw error;
    }
  };

  const claimTokens = async () => {
    if (!address) throw new Error('Wallet not connected');
    if (!isContractsConfigured) throw new Error('Contract addresses are not configured');

    if (isTronMode) {
      try {
        const tronWeb = getTronWeb();
        if (!tronWeb) throw new Error('TronWeb not available. Open TronLink and reconnect.');
        const ido = await tronWeb.contract().at(IDO_CONTRACT_ADDRESS);
        const txId = await ido.claim().send();
        return String(txId);
      } catch (error) {
        console.error('TRON claim failed:', error);
        throw error;
      }
    }
    
    try {
      const hash = await writeContractAsync({
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
    if (!isTronMode && !publicClient) throw new Error('Public client not available');
    if (!isTronMode && !readClient) throw new Error('Read client not available');

    if (isTronMode) {
      try {
        const tronWeb = getTronWeb();
        if (!tronWeb) throw new Error('TronWeb not available. Open TronLink and reconnect.');

        const ido = await tronWeb.contract().at(IDO_CONTRACT_ADDRESS);
        const usdt = await tronWeb.contract().at(USDT_CONTRACT_ADDRESS);

        const [isBuyPausedRaw, startTimeRaw, endTimeRaw] = await Promise.all([
          ido.isBuyPaused().call(),
          ido.startTime().call(),
          ido.endTime().call(),
        ]);

        if (toBoolSafe(isBuyPausedRaw)) {
          throw new Error('Invoice payment is currently paused by admin.');
        }

        const nowSeconds = BigInt(Math.floor(Date.now() / 1000));
        const startTime = toBigIntSafe(startTimeRaw);
        const endTime = toBigIntSafe(endTimeRaw);
        if (nowSeconds < startTime || nowSeconds > endTime) {
          throw new Error('Sale is inactive on-chain. Invoice payment is unavailable right now.');
        }

        const rawInvoice = await ido.getInvoice(invoiceId).call();
        const exists = toBoolSafe((rawInvoice as any)?.exists ?? rawInvoice?.[0]);
        const paid = toBoolSafe((rawInvoice as any)?.paid ?? rawInvoice?.[1]);
        const invoiceUsdtAmount = toBigIntSafe((rawInvoice as any)?.usdtAmount ?? rawInvoice?.[3]);
        const invoiceTokenAmount = toBigIntSafe((rawInvoice as any)?.tokenAmount ?? rawInvoice?.[4]);
        const invoiceExpiry = toBigIntSafe((rawInvoice as any)?.expiryDate ?? rawInvoice?.[5]);
        const recipientWallet = normalizeTronAddress((rawInvoice as any)?.recipientWallet ?? rawInvoice?.[6]);

        if (!exists) throw new Error('Invoice not found on-chain.');
        if (paid) throw new Error('Invoice is already paid.');
        if (nowSeconds > invoiceExpiry) throw new Error('Invoice is already expired.');

        if (!isZeroAddressLike(recipientWallet) && recipientWallet.toLowerCase() !== address.toLowerCase()) {
          throw new Error('Connected wallet is not authorized to pay this invoice.');
        }

        const quote = await ido.simulateBuy(invoiceTokenAmount.toString()).call();
        const requiredUsdtForInvoiceTokens = toBigIntSafe((quote as any)?.totalCost ?? quote?.[0]);
        if (requiredUsdtForInvoiceTokens > invoiceUsdtAmount) {
          throw new Error(
            'Invoice can no longer be paid at current tier price (invoice amount exceeded). Ask admin to reissue this invoice.',
          );
        }

        const currentAllowance = toBigIntSafe(await usdt.allowance(address, IDO_CONTRACT_ADDRESS).call());
        const currentUsdtBalance = toBigIntSafe(await usdt.balanceOf(address).call());

        if (currentUsdtBalance < invoiceUsdtAmount) {
          throw new Error('Insufficient USDT balance for this invoice.');
        }

        if (currentAllowance < invoiceUsdtAmount) {
          throw new Error('USDT allowance is lower than invoice amount. Please approve again.');
        }

        const maxUsdtAllowed = parseUnits(usdtAmount, 6).toString();
        const txId = await ido.payInvoice(invoiceId, maxUsdtAllowed).send();
        return String(txId);
      } catch (error) {
        console.error('TRON pay invoice failed:', error);
        throw new Error(extractErrorMessage(error));
      }
    }

    try {
      const [isBuyPaused, startTime, endTime] = (await Promise.all([
        readClient.readContract({
          address: IDO_CONTRACT_ADDRESS,
          abi: IDO_ABI,
          functionName: 'isBuyPaused',
        }),
        readClient.readContract({
          address: IDO_CONTRACT_ADDRESS,
          abi: IDO_ABI,
          functionName: 'startTime',
        }),
        readClient.readContract({
          address: IDO_CONTRACT_ADDRESS,
          abi: IDO_ABI,
          functionName: 'endTime',
        }),
      ])) as [boolean, bigint, bigint];

      if (isBuyPaused) {
        throw new Error('Invoice payment is currently paused by admin.');
      }

      const nowSeconds = BigInt(Math.floor(Date.now() / 1000));
      if (nowSeconds < startTime || nowSeconds > endTime) {
        throw new Error('Sale is inactive on-chain. Invoice payment is unavailable right now.');
      }

      const onChainInvoice = (await readClient.readContract({
        address: IDO_CONTRACT_ADDRESS,
        abi: IDO_ABI,
        functionName: 'getInvoice',
        args: [invoiceId],
      })) as unknown as [
        boolean,
        boolean,
        string,
        bigint,
        bigint,
        bigint,
        Address,
        string,
        Address,
        bigint,
        bigint,
      ];

      const exists = onChainInvoice[0];
      const isPaid = onChainInvoice[1];
      const invoiceUsdtAmount = onChainInvoice[3];
      const invoiceTokenAmount = onChainInvoice[4];
      const invoiceExpiry = onChainInvoice[5];
      const recipientWallet = onChainInvoice[6];

      if (!exists) {
        throw new Error('Invoice not found on-chain.');
      }

      if (isPaid) {
        throw new Error('Invoice is already paid.');
      }

      if (nowSeconds > invoiceExpiry) {
        throw new Error('Invoice is already expired.');
      }

      if (
        recipientWallet !== '0x0000000000000000000000000000000000000000' &&
        recipientWallet.toLowerCase() !== address.toLowerCase()
      ) {
        throw new Error('Connected wallet is not authorized to pay this invoice.');
      }

      const quoteForInvoiceTokens = (await readClient.readContract({
        address: IDO_CONTRACT_ADDRESS,
        abi: IDO_ABI,
        functionName: 'simulateBuy',
        args: [invoiceTokenAmount],
      })) as unknown as [bigint, bigint, bigint[], bigint[]];

      const requiredUsdtForInvoiceTokens = quoteForInvoiceTokens[0];
      if (requiredUsdtForInvoiceTokens > invoiceUsdtAmount) {
        throw new Error(
          'Invoice can no longer be paid at current tier price (invoice amount exceeded). Ask admin to reissue this invoice.',
        );
      }

      const invoiceAmount = formatUnits(invoiceUsdtAmount, 6);
      const maxUsdtAllowed = parseUnits(invoiceAmount.toString(), 6);

      console.log('invoiceId:', invoiceId);
      console.log('maxUsdtAllowed:', maxUsdtAllowed.toString());

      const [currentAllowance, currentUsdtBalance] = (await Promise.all([
        readClient.readContract({
          address: USDT_CONTRACT_ADDRESS,
          abi: USDT_ABI,
          functionName: 'allowance',
          args: [address as Address, IDO_CONTRACT_ADDRESS],
        }),
        readClient.readContract({
          address: USDT_CONTRACT_ADDRESS,
          abi: USDT_ABI,
          functionName: 'balanceOf',
          args: [address as Address],
        }),
      ])) as [bigint, bigint];

      if (currentUsdtBalance < invoiceUsdtAmount) {
        throw new Error('Insufficient USDT balance for this invoice.');
      }

      if (currentAllowance < invoiceUsdtAmount) {
        throw new Error('USDT allowance is lower than invoice amount. Please approve again.');
      }

      let hash: `0x${string}`;

      try {
        await readClient.simulateContract({
          address: IDO_CONTRACT_ADDRESS,
          abi: IDO_ABI,
          functionName: 'payInvoice',
          args: [invoiceId, maxUsdtAllowed],
          account: address as Address,
        });

        hash = await writeContractAsync({
          address: IDO_CONTRACT_ADDRESS,
          abi: IDO_ABI,
          functionName: 'payInvoice',
          args: [invoiceId, maxUsdtAllowed],
        });
      } catch (simulationError) {
        console.error('payInvoice simulation failed:', simulationError);
        console.log('Retrying legacy payInvoice(string) signature...');

        await readClient.simulateContract({
          address: IDO_CONTRACT_ADDRESS,
          abi: PAY_INVOICE_LEGACY_ABI,
          functionName: 'payInvoice',
          args: [invoiceId],
          account: address as Address,
        });

        hash = await writeContractAsync({
          address: IDO_CONTRACT_ADDRESS,
          abi: PAY_INVOICE_LEGACY_ABI,
          functionName: 'payInvoice',
          args: [invoiceId],
        });
      }

      await publicClient.waitForTransactionReceipt({ hash });
      return hash;
    } catch (error) {
      console.error('Pay invoice failed:', error);
      const message = extractErrorMessage(error);
      if (message.toLowerCase().includes('execution reverted')) {
        throw new Error(
          'Invoice payment reverted on-chain. Common causes: sale inactive, invoice price mismatch, expired invoice, or wallet not authorized.',
        );
      }
      throw new Error(message);
    }
  };

  const getOnChainInvoice = async (invoiceId: string): Promise<OnChainInvoice | null> => {
    if (!isContractsConfigured || !invoiceId) return null;

    if (isTronMode) {
      try {
        const tronWeb = getTronWeb();
        if (!tronWeb) return null;

        const ido = await tronWeb.contract().at(IDO_CONTRACT_ADDRESS);
        const rawInvoice = await ido.getInvoice(invoiceId).call();

        const exists = toBoolSafe((rawInvoice as any)?.exists ?? rawInvoice?.[0]);
        if (!exists) return null;

        return {
          exists,
          paid: toBoolSafe((rawInvoice as any)?.paid ?? rawInvoice?.[1]),
          invoiceId: String((rawInvoice as any)?.invoiceId ?? rawInvoice?.[2] ?? invoiceId),
          usdtAmount: formatUnits(toBigIntSafe((rawInvoice as any)?.usdtAmount ?? rawInvoice?.[3]), 6),
          tokenAmount: formatUnits(toBigIntSafe((rawInvoice as any)?.tokenAmount ?? rawInvoice?.[4]), 18),
          expiryDate: Number(toBigIntSafe((rawInvoice as any)?.expiryDate ?? rawInvoice?.[5])),
          recipientWallet: normalizeTronAddress((rawInvoice as any)?.recipientWallet ?? rawInvoice?.[6]),
          notes: String((rawInvoice as any)?.notes ?? rawInvoice?.[7] ?? ''),
          payer: normalizeTronAddress((rawInvoice as any)?.payer ?? rawInvoice?.[8]),
          paidAt: Number(toBigIntSafe((rawInvoice as any)?.paidAt ?? rawInvoice?.[9])),
          usdtSpent: formatUnits(toBigIntSafe((rawInvoice as any)?.usdtSpent ?? rawInvoice?.[10]), 6),
        };
      } catch (error) {
        console.error('Failed to read TRON invoice:', error);
        return null;
      }
    }

    if (!readClient) return null;

    try {
      const rawInvoice = (await readClient.readContract({
        address: IDO_CONTRACT_ADDRESS,
        abi: IDO_ABI,
        functionName: 'getInvoice',
        args: [invoiceId],
      })) as unknown as [
        boolean,
        boolean,
        string,
        bigint,
        bigint,
        bigint,
        Address,
        string,
        Address,
        bigint,
        bigint,
      ];

      if (!rawInvoice?.[0]) return null;

      return {
        exists: rawInvoice[0],
        paid: rawInvoice[1],
        invoiceId: rawInvoice[2],
        usdtAmount: formatUnits(rawInvoice[3], 6),
        tokenAmount: formatUnits(rawInvoice[4], 18),
        expiryDate: Number(rawInvoice[5]),
        recipientWallet: rawInvoice[6],
        notes: rawInvoice[7],
        payer: rawInvoice[8],
        paidAt: Number(rawInvoice[9]),
        usdtSpent: formatUnits(rawInvoice[10], 6),
      };
    } catch (error) {
      // Some deployed versions return InvoiceData as a tuple struct.
      try {
        const tupleResult = (await readClient.readContract({
          address: IDO_CONTRACT_ADDRESS,
          abi: GET_INVOICE_TUPLE_ABI,
          functionName: 'getInvoice',
          args: [invoiceId],
        })) as unknown;

        const tupleInvoice = (Array.isArray(tupleResult) ? tupleResult[0] : tupleResult) as {
          exists: boolean;
          paid: boolean;
          invoiceId: string;
          usdtAmount: bigint;
          tokenAmount: bigint;
          expiryDate: bigint;
          recipientWallet: Address;
          notes: string;
          payer: Address;
          paidAt: bigint;
          usdtSpent: bigint;
        };

        if (!tupleInvoice?.exists) return null;

        return {
          exists: tupleInvoice.exists,
          paid: tupleInvoice.paid,
          invoiceId: tupleInvoice.invoiceId,
          usdtAmount: formatUnits(tupleInvoice.usdtAmount, 6),
          tokenAmount: formatUnits(tupleInvoice.tokenAmount, 18),
          expiryDate: Number(tupleInvoice.expiryDate),
          recipientWallet: tupleInvoice.recipientWallet,
          notes: tupleInvoice.notes,
          payer: tupleInvoice.payer,
          paidAt: Number(tupleInvoice.paidAt),
          usdtSpent: formatUnits(tupleInvoice.usdtSpent, 6),
        };
      } catch (fallbackError) {
        console.error('Failed to read on-chain invoice:', fallbackError);
        return null;
      }
    }
  };

  const getInvoicePaymentTxHash = async (invoiceId: string): Promise<string | null> => {
    if (!isContractsConfigured || !invoiceId) return null;

    if (isTronMode) {
      try {
        const tronWeb = getTronWeb();
        if (!tronWeb) return null;
        const events = await tronWeb.getEventResult(IDO_CONTRACT_ADDRESS, {
          eventName: 'InvoicePaid',
          size: 200,
        });

        const matching = (events || []).filter((event: any) => {
          const payload = event?.result || event?.event_result || {};
          return String(payload?.invoiceId || '') === invoiceId;
        });

        if (matching.length === 0) return null;
        return String(matching[matching.length - 1]?.transaction_id || '');
      } catch (error) {
        console.error('Failed to read TRON invoice payment logs:', error);
        return null;
      }
    }

    if (!readClient) return null;

    try {
      const logs = await getLogsInChunks({
        event: INVOICE_PAID_EVENT,
        fromBlock: 0n,
        toBlock: 'latest',
      });

      const matchingLogs = logs.filter(
        (log) => (log.args as Record<string, unknown> | undefined)?.invoiceId === invoiceId,
      );

      if (matchingLogs.length === 0) return null;

      return matchingLogs[matchingLogs.length - 1].transactionHash;
    } catch (error) {
      console.error('Failed to read invoice payment logs:', error);
      return null;
    }
  };

  const getCreatedInvoiceIds = async (): Promise<string[]> => {
    if (!isContractsConfigured) return [];

    if (isTronMode) {
      try {
        const tronWeb = getTronWeb();
        if (!tronWeb) return [];

        const events = await tronWeb.getEventResult(IDO_CONTRACT_ADDRESS, {
          eventName: 'InvoiceCreated',
          size: 500,
        });

        const seen = new Set<string>();
        const invoiceIds: string[] = [];

        for (let index = (events || []).length - 1; index >= 0; index -= 1) {
          const payload = events[index]?.result || events[index]?.event_result || {};
          const invoiceId = String(payload?.invoiceId || '');
          if (!invoiceId || seen.has(invoiceId)) continue;
          seen.add(invoiceId);
          invoiceIds.push(invoiceId);
        }

        return invoiceIds;
      } catch (error) {
        console.error('Failed to read TRON invoice creation logs:', error);
        return [];
      }
    }

    if (!readClient) return [];

    try {
      const logs = await getLogsInChunks({
        event: INVOICE_CREATED_EVENT,
        fromBlock: 0n,
        toBlock: 'latest',
      });

      const seen = new Set<string>();
      const invoiceIds: string[] = [];

      // Newest-first, unique IDs.
      for (let index = logs.length - 1; index >= 0; index -= 1) {
        const invoiceId = (logs[index].args as Record<string, unknown> | undefined)?.invoiceId;
        if (typeof invoiceId !== 'string' || invoiceId.length === 0 || seen.has(invoiceId)) {
          continue;
        }

        seen.add(invoiceId);
        invoiceIds.push(invoiceId);
      }

      return invoiceIds;
    } catch (error) {
      console.error('Failed to read invoice creation logs:', error);
      return [];
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
    if (!isTronMode && !publicClient) throw new Error('Public client not available');
    if (!isTronMode && !readClient) throw new Error('Read client not available');

    const recipient = params.recipientWallet?.trim();
    if (recipient && !isTronMode && !isAddress(recipient)) {
      throw new Error('Invalid recipient wallet address');
    }

    const expiryTimestamp = Math.floor(new Date(params.expiryDate).getTime() / 1000);
    if (!Number.isFinite(expiryTimestamp) || expiryTimestamp <= 0) {
      throw new Error('Invalid expiry date');
    }

    if (isTronMode) {
      try {
        const tronWeb = getTronWeb();
        if (!tronWeb) throw new Error('TronWeb not available. Open TronLink and reconnect.');

        const ido = await tronWeb.contract().at(IDO_CONTRACT_ADDRESS);
        const adminsRaw = await ido.getAdmins().call();
        const admins = (Array.isArray(adminsRaw) ? adminsRaw : [adminsRaw]).map((admin) =>
          String(admin).toLowerCase(),
        );

        if (!admins.includes(address.toLowerCase())) {
          throw new Error('Connected wallet is not an on-chain admin for invoice creation');
        }

        const recipientWallet = recipient || TRON_ZERO_ADDRESS_BASE58;
        const txId = await ido
          .createInvoice(
            params.invoiceId,
            parseUnits(params.usdtAmount, 6).toString(),
            parseUnits(params.tokenAmount, 18).toString(),
            String(expiryTimestamp),
            recipientWallet,
            params.notes || '',
          )
          .send();

        return String(txId);
      } catch (error) {
        console.error('TRON create invoice failed:', error);
        throw error;
      }
    }

    const admins = (await readClient!.readContract({
      address: IDO_CONTRACT_ADDRESS,
      abi: IDO_ABI,
      functionName: 'getAdmins',
    })) as Address[];

    const isAdmin = admins.some((admin) => admin.toLowerCase() === address.toLowerCase());
    if (!isAdmin) {
      throw new Error('Connected wallet is not an on-chain admin for invoice creation');
    }

    const createArgs = [
      params.invoiceId,
      parseUnits(params.usdtAmount, 6),
      parseUnits(params.tokenAmount, 18),
      BigInt(expiryTimestamp),
      (recipient || '0x0000000000000000000000000000000000000000') as Address,
      params.notes || '',
    ] as const;

    await readClient!.simulateContract({
      address: IDO_CONTRACT_ADDRESS,
      abi: IDO_ABI,
      functionName: 'createInvoice',
      args: createArgs,
      account: address as Address,
    });

    try {
      const hash = await writeContractAsync({
        address: IDO_CONTRACT_ADDRESS,
        abi: IDO_ABI,
        functionName: 'createInvoice',
        args: createArgs,
      });

      await publicClient!.waitForTransactionReceipt({ hash });
      return hash;
    } catch (error) {
      if (isUserRejectedError(error)) {
        throw new Error('Transaction cancelled in wallet. If MetaMask shows Review alert, open it and approve before confirming. No on-chain changes were made.');
      }

      console.error('Create invoice failed:', error);
      throw new Error(extractErrorMessage(error));
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

  const getUserActivity = async (
    userAddress?: string,
    limit = 50,
  ): Promise<PortfolioActivityItem[]> => {
    if (!isContractsConfigured) return [];

    const target = userAddress ?? address;
    if (!target) return [];

    if (isTronMode) {
      try {
        const tronWeb = getTronWeb();
        if (!tronWeb) return [];

        const [purchaseEvents, claimEvents] = await Promise.all([
          tronWeb.getEventResult(IDO_CONTRACT_ADDRESS, {
            eventName: 'TokensPurchased',
            size: limit,
          }),
          tronWeb.getEventResult(IDO_CONTRACT_ADDRESS, {
            eventName: 'TokensClaimed',
            size: limit,
          }),
        ]);

        const purchases = (purchaseEvents || [])
          .filter((event: any) => String(event?.result?.buyer || '').toLowerCase() === String(target).toLowerCase())
          .map((event: any) => ({
            type: 'purchase' as const,
            amount: formatUnits(toBigIntSafe(event?.result?.tokenAmount), 18),
            usdtAmount: formatUnits(toBigIntSafe(event?.result?.usdtSpent), 6),
            txHash: String(event?.transaction_id || ''),
            timestamp: Number((event?.block_timestamp || 0) / 1000),
          }));

        const claims = (claimEvents || [])
          .filter((event: any) => String(event?.result?.claimer || '').toLowerCase() === String(target).toLowerCase())
          .map((event: any) => ({
            type: 'claim' as const,
            amount: formatUnits(toBigIntSafe(event?.result?.amount), 18),
            txHash: String(event?.transaction_id || ''),
            timestamp: Number((event?.block_timestamp || 0) / 1000),
          }));

        return [...purchases, ...claims]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, limit);
      } catch (error) {
        console.error('Failed to load TRON user activity:', error);
        return [];
      }
    }

    if (!readClient) return [];

    try {
      const [purchaseLogs, claimLogs] = await Promise.all([
        getLogsInChunks({
          event: TOKENS_PURCHASED_EVENT,
          args: { buyer: target as Address },
          fromBlock: 0n,
          toBlock: 'latest',
        }),
        getLogsInChunks({
          event: TOKENS_CLAIMED_EVENT,
          args: { claimer: target as Address },
          fromBlock: 0n,
          toBlock: 'latest',
        }),
      ]);

      const mergedLogs = [...purchaseLogs, ...claimLogs].sort((a, b) => {
        if (a.blockNumber === b.blockNumber) {
          return Number((b.logIndex ?? 0) - (a.logIndex ?? 0));
        }
        return Number((b.blockNumber ?? 0n) - (a.blockNumber ?? 0n));
      });

      const recentLogs = mergedLogs.slice(0, limit);
      const blockNumbers = [...new Set(recentLogs.map((log) => String(log.blockNumber ?? 0n)))];
      const blocks = await Promise.all(
        blockNumbers.map(async (blockNumber) => {
          const block = await readClient.getBlock({ blockNumber: BigInt(blockNumber) });
          return [blockNumber, Number(block.timestamp)] as const;
        }),
      );
      const blockTimestampMap = new Map<string, number>(blocks);

      return recentLogs.map((log) => {
        const eventName = (log as { eventName?: string }).eventName;
        const args = (log as { args?: Record<string, unknown> }).args ?? {};
        const timestamp = blockTimestampMap.get(String(log.blockNumber ?? 0n)) ?? 0;

        if (eventName === 'TokensPurchased') {
          return {
            type: 'purchase',
            amount: formatUnits((args.tokenAmount as bigint) ?? 0n, 18),
            usdtAmount: formatUnits((args.usdtSpent as bigint) ?? 0n, 6),
            txHash: log.transactionHash,
            timestamp,
          };
        }

        return {
          type: 'claim',
          amount: formatUnits((args.amount as bigint) ?? 0n, 18),
          txHash: log.transactionHash,
          timestamp,
        };
      });
    } catch (error) {
      console.error('Failed to load user activity:', error);
      return [];
    }
  };

  return {
    stats,
    approveUsdt,
    buyTokens,
    payInvoice,
    createInvoice,
    getOnChainInvoice,
    getInvoicePaymentTxHash,
    getCreatedInvoiceIds,
    claimTokens,
    simulateBuy,
    getUserActivity,
  };
};

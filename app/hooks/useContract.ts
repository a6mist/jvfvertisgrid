import { useMemo } from 'react';
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { formatUnits, parseUnits, type Address, isAddress, parseAbiItem } from 'viem';
import {
  IDO_CONTRACT_ADDRESS,
  USDT_CONTRACT_ADDRESS,
  isContractsConfigured,
} from '../config/contracts';

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
  txHash: `0x${string}`;
  timestamp: number;
}

export interface OnChainInvoice {
  exists: boolean;
  paid: boolean;
  invoiceId: string;
  usdtAmount: string;
  tokenAmount: string;
  expiryDate: number;
  recipientWallet: Address;
  notes: string;
  payer: Address;
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

export const useIdoContract = () => {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const readClient = usePublicClient({ chainId: READ_CHAIN_ID });
  const account = (address ?? '0x0000000000000000000000000000000000000000') as Address;

  const { data: currentPriceRaw } = useReadContract({
    chainId: READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ABI,
    functionName: 'getCurrentPrice',
    query: { enabled: isContractsConfigured },
  });

  const { data: currentTierRaw } = useReadContract({
    chainId: READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ABI,
    functionName: 'currentTier',
    query: { enabled: isContractsConfigured },
  });

  const { data: totalSoldRaw } = useReadContract({
    chainId: READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ABI,
    functionName: 'totalSold',
    query: { enabled: isContractsConfigured },
  });

  const { data: totalUsdtCollectedRaw } = useReadContract({
    chainId: READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ABI,
    functionName: 'totalUsdtCollected',
    query: { enabled: isContractsConfigured },
  });

  const { data: totalParticipantsRaw } = useReadContract({
    chainId: READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ABI,
    functionName: 'totalParticipants',
    query: { enabled: isContractsConfigured },
  });

  const { data: startPriceRaw } = useReadContract({
    chainId: READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ABI,
    functionName: 'START_PRICE',
    query: { enabled: isContractsConfigured },
  });

  const { data: priceIncrementRaw } = useReadContract({
    chainId: READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ABI,
    functionName: 'PRICE_INCREMENT',
    query: { enabled: isContractsConfigured },
  });

  const { data: usdtPerTierRaw } = useReadContract({
    chainId: READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ABI,
    functionName: 'USDT_PER_TIER',
    query: { enabled: isContractsConfigured },
  });

  const { data: maxTokensRaw } = useReadContract({
    chainId: READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ABI,
    functionName: 'MAX_TOKENS',
    query: { enabled: isContractsConfigured },
  });

  const { data: userPurchasedRaw } = useReadContract({
    chainId: READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ABI,
    functionName: 'purchased',
    args: [account],
    query: { enabled: isContractsConfigured && Boolean(address) },
  });

  const { data: userClaimedRaw } = useReadContract({
    chainId: READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ABI,
    functionName: 'claimed',
    args: [account],
    query: { enabled: isContractsConfigured && Boolean(address) },
  });

  const { data: usdtBalanceRaw } = useReadContract({
    chainId: READ_CHAIN_ID,
    address: USDT_CONTRACT_ADDRESS,
    abi: USDT_ABI,
    functionName: 'balanceOf',
    args: [account],
    query: {
      enabled: isContractsConfigured && Boolean(address),
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
      enabled: isContractsConfigured && Boolean(address),
      refetchInterval: 3000,
    },
  });

  const stats = useMemo<IdoStats>(
    () => ({
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
    }),
    [
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
    ],
  );

  const approveUsdt = async (amount: string) => {
    if (!address) throw new Error('Wallet not connected');
    if (!isContractsConfigured) throw new Error('Contract addresses are not configured');
    if (!readClient) throw new Error('Read client not available');
    
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
    if (!readClient) throw new Error('Read client not available');
    
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
    if (!publicClient) throw new Error('Public client not available');
    if (!readClient) throw new Error('Read client not available');

    try {
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

      const nowSeconds = BigInt(Math.floor(Date.now() / 1000));
      if (nowSeconds > invoiceExpiry) {
        throw new Error('Invoice is already expired.');
      }

      if (
        recipientWallet !== '0x0000000000000000000000000000000000000000' &&
        recipientWallet.toLowerCase() !== address.toLowerCase()
      ) {
        throw new Error('Connected wallet is not authorized to pay this invoice.');
      }

      const quoteForInvoiceUsdt = (await readClient.readContract({
        address: IDO_CONTRACT_ADDRESS,
        abi: IDO_ABI,
        functionName: 'simulateBuyWithUSDT',
        args: [invoiceUsdtAmount],
      })) as unknown as [bigint, bigint, bigint[], bigint[], bigint];

      const purchasableTokensForInvoiceUsdt = quoteForInvoiceUsdt[0];
      if (purchasableTokensForInvoiceUsdt < invoiceTokenAmount) {
        throw new Error(
          'Invoice can no longer be paid at current tier price. Ask admin to reissue this invoice.',
        );
      }

      const parsedMaxUsdt = parseUnits(usdtAmount, 6);
      const maxUsdtAllowed = parsedMaxUsdt < invoiceUsdtAmount ? invoiceUsdtAmount : parsedMaxUsdt;

      await readClient.simulateContract({
        address: IDO_CONTRACT_ADDRESS,
        abi: IDO_ABI,
        functionName: 'payInvoice',
        args: [invoiceId, maxUsdtAllowed],
        account: address as Address,
      });

      const hash = await writeContractAsync({
        address: IDO_CONTRACT_ADDRESS,
        abi: IDO_ABI,
        functionName: 'payInvoice',
        args: [invoiceId, maxUsdtAllowed],
      });

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
    if (!isContractsConfigured || !readClient || !invoiceId) return null;

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
    if (!isContractsConfigured || !readClient || !invoiceId) return null;

    try {
      const logs = await readClient.getLogs({
        address: IDO_CONTRACT_ADDRESS,
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
    if (!isContractsConfigured || !readClient) return [];

    try {
      const logs = await readClient.getLogs({
        address: IDO_CONTRACT_ADDRESS,
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
    if (!publicClient) throw new Error('Public client not available');
    if (!readClient) throw new Error('Read client not available');

    const recipient = params.recipientWallet?.trim();
    if (recipient && !isAddress(recipient)) {
      throw new Error('Invalid recipient wallet address');
    }

    const expiryTimestamp = Math.floor(new Date(params.expiryDate).getTime() / 1000);
    if (!Number.isFinite(expiryTimestamp) || expiryTimestamp <= 0) {
      throw new Error('Invalid expiry date');
    }

    const admins = (await readClient.readContract({
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

    // Preflight the tx so users do not get a guaranteed-fail MetaMask request.
    await readClient.simulateContract({
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

      await publicClient.waitForTransactionReceipt({ hash });
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

  const getUserActivity = async (
    userAddress?: Address,
    limit = 50,
  ): Promise<PortfolioActivityItem[]> => {
    if (!isContractsConfigured || !readClient) return [];

    const target = userAddress ?? address;
    if (!target) return [];

    try {
      const [purchaseLogs, claimLogs] = await Promise.all([
        readClient.getLogs({
          address: IDO_CONTRACT_ADDRESS,
          event: TOKENS_PURCHASED_EVENT,
          args: { buyer: target },
          fromBlock: 0n,
          toBlock: 'latest',
        }),
        readClient.getLogs({
          address: IDO_CONTRACT_ADDRESS,
          event: TOKENS_CLAIMED_EVENT,
          args: { claimer: target },
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

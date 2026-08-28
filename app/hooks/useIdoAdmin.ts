import { useEffect, useMemo, useState } from "react";
import { useAccount, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { formatUnits, isAddress, parseUnits, type Address } from "viem";
import {
  IDO_CONTRACT_ADDRESS,
  USDT_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ADDRESS,
  isContractsConfigured,
} from "../config/contracts";

const ADMIN_READ_CHAIN_ID = 1;

const IDO_ADMIN_ABI = [
  { name: "saleHasEnd", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] },
  { name: "isBuyPaused", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] },
  { name: "isClaimPaused", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] },
  { name: "startTime", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "endTime", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "released", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] },
  { name: "totalSold", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "totalUsdtCollected", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "currentTier", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "getCurrentPrice", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "MAX_TOKENS", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "owner", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { name: "getAdmins", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "address[]" }] },
  { name: "getSigners", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "address[]" }] },
  { name: "requiredApprovals", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "requestCount", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  {
    name: "getRequests",
    type: "function",
    stateMutability: "view",
    inputs: [{ type: "uint256", name: "start" }, { type: "uint256", name: "count" }],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { type: "uint256", name: "id" },
          { type: "address", name: "token" },
          { type: "uint256", name: "amount" },
          { type: "address", name: "to" },
          { type: "uint256", name: "approvals" },
          { type: "bool", name: "executed" },
          { type: "uint256", name: "createdAt" },
          { type: "string", name: "purpose" },
        ],
      },
      { type: "uint256", name: "nextStart" },
    ],
  },
  {
    name: "getApprovalStatus",
    type: "function",
    stateMutability: "view",
    inputs: [{ type: "uint256", name: "requestId" }],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { type: "address", name: "signer" },
          { type: "bool", name: "approved" },
        ],
      },
    ],
  },
  { name: "setBuyPaused", type: "function", stateMutability: "nonpayable", inputs: [{ type: "bool", name: "paused" }], outputs: [] },
  { name: "setClaimPaused", type: "function", stateMutability: "nonpayable", inputs: [{ type: "bool", name: "paused" }], outputs: [] },
  { name: "setSaleHasEnd", type: "function", stateMutability: "nonpayable", inputs: [{ type: "bool", name: "hasEnd" }], outputs: [] },
  {
    name: "setSaleTimes",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ type: "uint256", name: "_startTime" }, { type: "uint256", name: "_endTime" }],
    outputs: [],
  },
  { name: "release", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "addAdmin", type: "function", stateMutability: "nonpayable", inputs: [{ type: "address", name: "account" }], outputs: [] },
  { name: "removeAdmin", type: "function", stateMutability: "nonpayable", inputs: [{ type: "address", name: "account" }], outputs: [] },
  { name: "addSigner", type: "function", stateMutability: "nonpayable", inputs: [{ type: "address", name: "account" }], outputs: [] },
  { name: "removeSigner", type: "function", stateMutability: "nonpayable", inputs: [{ type: "address", name: "account" }], outputs: [] },
  {
    name: "setRequiredApprovals",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ type: "uint256", name: "newRequiredApprovals" }],
    outputs: [],
  },
  {
    name: "createWithdrawRequest",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { type: "address", name: "_token" },
      { type: "uint256", name: "amount" },
      { type: "address", name: "to" },
      { type: "string", name: "_purpose" },
    ],
    outputs: [],
  },
  { name: "approveWithdraw", type: "function", stateMutability: "nonpayable", inputs: [{ type: "uint256", name: "requestId" }], outputs: [] },
  { name: "withdrawToken", type: "function", stateMutability: "nonpayable", inputs: [{ type: "uint256", name: "requestId" }], outputs: [] },
] as const;

type ApprovalEntry = { signer: Address; approved: boolean };

type RequestEntry = {
  id: bigint;
  token: Address;
  amount: bigint;
  to: Address;
  approvals: bigint;
  executed: boolean;
  createdAt: bigint;
  purpose: string;
};

const ERC20_DECIMALS_ABI = [
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
] as const;

const extractErrorMessage = (error: unknown): string => {
  const seen = new Set<unknown>();
  const queue: unknown[] = [error];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || typeof current !== "object" || seen.has(current)) continue;
    seen.add(current);

    const candidate = current as {
      shortMessage?: unknown;
      reason?: unknown;
      details?: unknown;
      message?: unknown;
      cause?: unknown;
      data?: unknown;
    };

    for (const key of ["shortMessage", "reason", "details", "message"] as const) {
      const value = candidate[key];
      if (typeof value === "string" && value.trim().length > 0) {
        return value.trim();
      }
    }

    if (candidate.cause) queue.push(candidate.cause);
    if (candidate.data) queue.push(candidate.data);
  }

  return "Transaction failed. Please check wallet confirmation and network status.";
};

const isUserRejectedError = (error: unknown): boolean => {
  const message = extractErrorMessage(error).toLowerCase();
  return (
    message.includes("user rejected") ||
    message.includes("user denied") ||
    message.includes("denied transaction signature") ||
    message.includes("rejected the request")
  );
};

export const useIdoAdmin = () => {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId: ADMIN_READ_CHAIN_ID });

  const [requests, setRequests] = useState<RequestEntry[]>([]);
  const [approvalsByRequest, setApprovalsByRequest] = useState<Record<string, ApprovalEntry[]>>({});
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [averagePurchase, setAveragePurchase] = useState("0");
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: isBuyPausedRaw } = useReadContract({
    chainId: ADMIN_READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ADMIN_ABI,
    functionName: "isBuyPaused",
    query: { enabled: isContractsConfigured },
  });
  const { data: saleHasEndRaw } = useReadContract({
    chainId: ADMIN_READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ADMIN_ABI,
    functionName: "saleHasEnd",
    query: { enabled: isContractsConfigured },
  });
  const { data: isClaimPausedRaw } = useReadContract({
    chainId: ADMIN_READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ADMIN_ABI,
    functionName: "isClaimPaused",
    query: { enabled: isContractsConfigured },
  });
  const { data: startTimeRaw } = useReadContract({
    chainId: ADMIN_READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ADMIN_ABI,
    functionName: "startTime",
    query: { enabled: isContractsConfigured },
  });
  const { data: endTimeRaw } = useReadContract({
    chainId: ADMIN_READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ADMIN_ABI,
    functionName: "endTime",
    query: { enabled: isContractsConfigured },
  });
  const { data: releasedRaw } = useReadContract({
    chainId: ADMIN_READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ADMIN_ABI,
    functionName: "released",
    query: { enabled: isContractsConfigured },
  });
  const { data: totalSoldRaw } = useReadContract({
    chainId: ADMIN_READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ADMIN_ABI,
    functionName: "totalSold",
    query: { enabled: isContractsConfigured },
  });
  const { data: totalUsdtCollectedRaw } = useReadContract({
    chainId: ADMIN_READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ADMIN_ABI,
    functionName: "totalUsdtCollected",
    query: { enabled: isContractsConfigured },
  });
  const { data: currentTierRaw } = useReadContract({
    chainId: ADMIN_READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ADMIN_ABI,
    functionName: "currentTier",
    query: { enabled: isContractsConfigured },
  });
  const { data: currentPriceRaw } = useReadContract({
    chainId: ADMIN_READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ADMIN_ABI,
    functionName: "getCurrentPrice",
    query: { enabled: isContractsConfigured },
  });
  const { data: maxTokensRaw } = useReadContract({
    chainId: ADMIN_READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ADMIN_ABI,
    functionName: "MAX_TOKENS",
    query: { enabled: isContractsConfigured },
  });
  const ownerRead = useReadContract({
    chainId: ADMIN_READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ADMIN_ABI,
    functionName: "owner",
    query: { enabled: isContractsConfigured },
  });
  const adminsRead = useReadContract({
    chainId: ADMIN_READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ADMIN_ABI,
    functionName: "getAdmins",
    query: { enabled: isContractsConfigured },
  });
  const signersRead = useReadContract({
    chainId: ADMIN_READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ADMIN_ABI,
    functionName: "getSigners",
    query: { enabled: isContractsConfigured },
  });
  const requiredApprovalsRead = useReadContract({
    chainId: ADMIN_READ_CHAIN_ID,
    address: IDO_CONTRACT_ADDRESS,
    abi: IDO_ADMIN_ABI,
    functionName: "requiredApprovals",
    query: { enabled: isContractsConfigured },
  });

  const ownerRaw = ownerRead.data;
  const adminsRaw = adminsRead.data;
  const signersRaw = signersRead.data;
  const requiredApprovalsRaw = requiredApprovalsRead.data;

  const hasReadIssue =
    Boolean(ownerRead.error && ownerRead.data === undefined) ||
    Boolean(adminsRead.error && adminsRead.data === undefined) ||
    Boolean(signersRead.error && signersRead.data === undefined) ||
    Boolean(requiredApprovalsRead.error && requiredApprovalsRead.data === undefined);

  useEffect(() => {
    const loadPurchaseStats = async () => {
      if (!publicClient || !isContractsConfigured) return;

      try {
        const logs = await publicClient.getLogs({
          address: IDO_CONTRACT_ADDRESS,
          fromBlock: 0n,
          event: {
            type: "event",
            name: "TokensPurchased",
            inputs: [
              { name: "buyer", type: "address", indexed: true },
              { name: "tokenAmount", type: "uint256", indexed: false },
              { name: "usdtSpent", type: "uint256", indexed: false },
            ],
          },
        });

        const buyers = new Set<string>();
        let totalUsdtSpent = 0n;

        for (const log of logs) {
          const buyer = String((log.args as Record<string, unknown>).buyer ?? "").toLowerCase();
          const usdtSpent = BigInt(((log.args as Record<string, unknown>).usdtSpent as bigint) ?? 0n);

          if (buyer) buyers.add(buyer);
          totalUsdtSpent += usdtSpent;
        }

        setTotalParticipants(buyers.size);
        if (logs.length > 0) {
          setAveragePurchase(formatUnits(totalUsdtSpent / BigInt(logs.length), 6));
        } else {
          setAveragePurchase("0");
        }
      } catch {
        setTotalParticipants(0);
        setAveragePurchase("0");
      }
    };

    const loadRequests = async () => {
      if (!publicClient || !isContractsConfigured) return;

      setIsLoadingRequests(true);
      try {
        const totalRequests = (await publicClient.readContract({
          address: IDO_CONTRACT_ADDRESS,
          abi: IDO_ADMIN_ABI,
          functionName: "requestCount",
        })) as bigint;

        const pageSize = 100n;
        const start = totalRequests > pageSize ? totalRequests - pageSize : 0n;
        const count = totalRequests > pageSize ? pageSize : totalRequests;

        const response = await publicClient.readContract({
          address: IDO_CONTRACT_ADDRESS,
          abi: IDO_ADMIN_ABI,
          functionName: "getRequests",
          args: [start, count],
        });

        const [chainRequests] = response;
        const parsedRequests = chainRequests as RequestEntry[];
        setRequests(parsedRequests.sort((a, b) => Number(b.id - a.id)));

        const approvalEntries = await Promise.all(
          parsedRequests.map(async (req) => {
            const approvals = (await publicClient.readContract({
              address: IDO_CONTRACT_ADDRESS,
              abi: IDO_ADMIN_ABI,
              functionName: "getApprovalStatus",
              args: [req.id],
            })) as ApprovalEntry[];

            return [req.id.toString(), approvals] as const;
          }),
        );

        setApprovalsByRequest(Object.fromEntries(approvalEntries));
      } catch {
        setRequests([]);
        setApprovalsByRequest({});
      } finally {
        setIsLoadingRequests(false);
      }
    };

    loadRequests();
    loadPurchaseStats();
  }, [publicClient, refreshKey]);

  const forceRefresh = () => setRefreshKey((v) => v + 1);

  const runWrite = async (
    functionName:
      | "setBuyPaused"
      | "setClaimPaused"
      | "setSaleHasEnd"
      | "setSaleTimes"
      | "release"
      | "addAdmin"
      | "removeAdmin"
      | "addSigner"

      | "removeSigner"
      | "setRequiredApprovals"
      | "createWithdrawRequest"
      | "approveWithdraw"
      | "withdrawToken",
    args: readonly unknown[] = [],
  ) => {
    if (!address) throw new Error("Wallet not connected");
    if (!isContractsConfigured) throw new Error("Contract address not configured");

    try {
      if (publicClient) {
        await publicClient.simulateContract({
          address: IDO_CONTRACT_ADDRESS,
          abi: IDO_ADMIN_ABI,
          functionName,
          args,
          account: address as Address,
        } as any);
      }

      const hash = await writeContractAsync({
        address: IDO_CONTRACT_ADDRESS,
        abi: IDO_ADMIN_ABI,
        functionName,
        args,
      } as any);

      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status !== "success") {
          throw new Error(`Transaction reverted on-chain. Tx: ${hash}`);
        }
      }

      forceRefresh();
      return hash;
    } catch (error) {
      if (isUserRejectedError(error)) {
        throw new Error("Transaction cancelled in wallet. If MetaMask shows Review alert, open it and approve before confirming. No on-chain changes were made.");
      }

      throw new Error(extractErrorMessage(error));
    }
  };

  const stats = useMemo(
    () => ({
      isBuyPaused: Boolean(isBuyPausedRaw ?? false),
      isClaimPaused: Boolean(isClaimPausedRaw ?? false),
      saleHasEnd: Boolean(saleHasEndRaw ?? false),
      startTime: Number(startTimeRaw ?? 0n),
      endTime: Number(endTimeRaw ?? 0n),
      released: Boolean(releasedRaw ?? false),
      totalSold: totalSoldRaw ? formatUnits(totalSoldRaw, 18) : "0",
      totalUsdtCollected: totalUsdtCollectedRaw ? formatUnits(totalUsdtCollectedRaw, 6) : "0",
      currentTier: Number(currentTierRaw ?? 0n),
      currentPrice: currentPriceRaw ? formatUnits(currentPriceRaw, 6) : "0",
      maxTokens: maxTokensRaw ? formatUnits(maxTokensRaw, 18) : "0",
      owner: ownerRaw ? String(ownerRaw).toLowerCase() : "",
      admins: ((adminsRaw ?? []) as Address[]).map((a) => a.toLowerCase()),
      signers: ((signersRaw ?? []) as Address[]).map((a) => a.toLowerCase()),
      requiredApprovals: Number(requiredApprovalsRaw ?? 0n),
      totalParticipants,
      averagePurchase,
    }),
    [
      isBuyPausedRaw,
      isClaimPausedRaw,
      saleHasEndRaw,
      startTimeRaw,
      endTimeRaw,
      releasedRaw,
      totalSoldRaw,
      totalUsdtCollectedRaw,
      currentTierRaw,
      currentPriceRaw,
      maxTokensRaw,
      ownerRaw,
      adminsRaw,
      signersRaw,
      requiredApprovalsRaw,
      totalParticipants,
      averagePurchase,
    ],
  );

  const connectedRole = useMemo(() => {
    if (!address) return "Viewer";
    const lower = address.toLowerCase();
    if (stats.owner && stats.owner === lower) return "Owner";
    if (stats.admins.includes(lower)) return "Admin";
    if (stats.signers.includes(lower)) return "Signer";
    return "Viewer";
  }, [address, stats.owner, stats.admins, stats.signers]);

  const setBuyPaused = async (paused: boolean) => runWrite("setBuyPaused", [paused]);
  const setClaimPaused = async (paused: boolean) => runWrite("setClaimPaused", [paused]);
  const setSaleHasEnd = async (hasEnd: boolean) => runWrite("setSaleHasEnd", [hasEnd]);
  const setSaleTimes = async (start: number, end: number) => runWrite("setSaleTimes", [BigInt(start), BigInt(end)]);
  const release = async () => runWrite("release", []);

  const addAdmin = async (adminAddress: string) => {
    if (!isAddress(adminAddress)) throw new Error("Invalid admin address");
    return runWrite("addAdmin", [adminAddress as Address]);
  };

  const removeAdmin = async (adminAddress: string) => {
    if (!isAddress(adminAddress)) throw new Error("Invalid admin address");
    return runWrite("removeAdmin", [adminAddress as Address]);
  };

  const addSigner = async (signerAddress: string) => {
    if (!isAddress(signerAddress)) throw new Error("Invalid signer address");
    return runWrite("addSigner", [signerAddress as Address]);
  };

  const removeSigner = async (signerAddress: string) => {
    if (!isAddress(signerAddress)) throw new Error("Invalid signer address");
    return runWrite("removeSigner", [signerAddress as Address]);
  };

  const setRequiredApprovals = async (value: number) => {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error("Required approvals must be a positive integer");
    }
    return runWrite("setRequiredApprovals", [BigInt(value)]);
  };

  const createWithdrawRequest = async (token: string, amount: string, to: string, purpose: string) => {
    if (!address) throw new Error("Wallet not connected");
    if (!isAddress(token)) throw new Error("Invalid token address");
    if (!isAddress(to)) throw new Error("Invalid recipient address");

    const lowerAddress = address.toLowerCase();
    const isOnChainAdmin = stats.owner === lowerAddress || stats.admins.includes(lowerAddress);
    if (!isOnChainAdmin) {
      throw new Error("Connected wallet is not an on-chain admin for creating withdraw requests.");
    }

    const normalizedToken = (token as Address).toLowerCase();
    const normalizedRecipient = (to as Address).toLowerCase();
    const normalizedPurpose = purpose.trim().toLowerCase();

    if (publicClient) {
      const tokenBytecode = await publicClient.getBytecode({ address: token as Address });
      if (!tokenBytecode || tokenBytecode === "0x") {
        throw new Error("Token address is not a deployed contract on Ethereum mainnet.");
      }
    }

    let decimals = 18;
    if (normalizedToken === USDT_CONTRACT_ADDRESS.toLowerCase()) {
      decimals = 6;
    } else if (normalizedToken === TOKEN_CONTRACT_ADDRESS.toLowerCase()) {
      decimals = 18;
    } else if (publicClient) {
      try {
        const tokenDecimals = (await publicClient.readContract({
          address: token as Address,
          abi: ERC20_DECIMALS_ABI,
          functionName: "decimals",
        })) as number;
        decimals = Number(tokenDecimals);
      } catch {
        throw new Error("Unable to read token decimals. Token may not be ERC20-compliant.");
      }
    }

    const parsedAmount = parseUnits(amount, decimals);
    const duplicateRequest = requests.find((request) => {
      if (request.executed) return false;
      return (
        request.token.toLowerCase() === normalizedToken &&
        request.to.toLowerCase() === normalizedRecipient &&
        request.amount === parsedAmount &&
        request.purpose.trim().toLowerCase() === normalizedPurpose
      );
    });

    if (duplicateRequest) {
      throw new Error(`Similar pending request already exists (#${duplicateRequest.id.toString()}).`);
    }

    return runWrite("createWithdrawRequest", [token as Address, parsedAmount, to as Address, purpose]);
  };

  const approveWithdraw = async (requestId: number) => runWrite("approveWithdraw", [BigInt(requestId)]);
  const withdrawToken = async (requestId: number) => runWrite("withdrawToken", [BigInt(requestId)]);

  return {
    isContractsConfigured,
    connectedRole,
    stats,
    hasReadIssue,
    requests,
    approvalsByRequest,
    isLoadingRequests,
    forceRefresh,
    setBuyPaused,
    setClaimPaused,
    setSaleHasEnd,
    setSaleTimes,
    release,
    addAdmin,
    removeAdmin,
    addSigner,
    removeSigner,
    setRequiredApprovals,
    createWithdrawRequest,
    approveWithdraw,
    withdrawToken,
  };
};

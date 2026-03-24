import { useMemo } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { formatUnits, isAddress, parseUnits, keccak256, toBytes, type Address } from "viem";
import { IDO_CONTRACT_ADDRESS, TOKEN_CONTRACT_ADDRESS, isTokenConfigured } from "../config/contracts";

const WLG_TOKEN_ABI = [
  { name: "totalSupply", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "paused", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] },
  { name: "burnEnabled", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] },
  { name: "pauseEnabled", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] },
  { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  {
    name: "hasRole",
    type: "function",
    stateMutability: "view",
    inputs: [{ type: "bytes32" }, { type: "address" }],
    outputs: [{ type: "bool" }],
  },
  { name: "mint", type: "function", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [] },
  { name: "pause", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "unpause", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { name: "setBurnEnabled", type: "function", stateMutability: "nonpayable", inputs: [{ type: "bool" }], outputs: [] },
  { name: "setPauseEnabled", type: "function", stateMutability: "nonpayable", inputs: [{ type: "bool" }], outputs: [] },
] as const;

const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
const MINTER_ROLE = keccak256(toBytes("MINTER_ROLE"));
const PAUSER_ROLE = keccak256(toBytes("PAUSER_ROLE"));

export const useWlgTokenAdmin = () => {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const totalSupplyRead = useReadContract({
    address: TOKEN_CONTRACT_ADDRESS,
    abi: WLG_TOKEN_ABI,
    functionName: "totalSupply",
    query: { enabled: isTokenConfigured },
  });

  const pausedRead = useReadContract({
    address: TOKEN_CONTRACT_ADDRESS,
    abi: WLG_TOKEN_ABI,
    functionName: "paused",
    query: { enabled: isTokenConfigured },
  });

  const burnEnabledRead = useReadContract({
    address: TOKEN_CONTRACT_ADDRESS,
    abi: WLG_TOKEN_ABI,
    functionName: "burnEnabled",
    query: { enabled: isTokenConfigured },
  });

  const pauseEnabledRead = useReadContract({
    address: TOKEN_CONTRACT_ADDRESS,
    abi: WLG_TOKEN_ABI,
    functionName: "pauseEnabled",
    query: { enabled: isTokenConfigured },
  });

  const idoInventoryRead = useReadContract({
    address: TOKEN_CONTRACT_ADDRESS,
    abi: WLG_TOKEN_ABI,
    functionName: "balanceOf",
    args: [IDO_CONTRACT_ADDRESS],
    query: { enabled: isTokenConfigured },
  });

  const totalSupplyRaw = totalSupplyRead.data;
  const pausedRaw = pausedRead.data;
  const burnEnabledRaw = burnEnabledRead.data;
  const pauseEnabledRaw = pauseEnabledRead.data;
  const idoInventoryRaw = idoInventoryRead.data;

  const { data: hasAdminRoleRaw } = useReadContract({
    address: TOKEN_CONTRACT_ADDRESS,
    abi: WLG_TOKEN_ABI,
    functionName: "hasRole",
    args: [DEFAULT_ADMIN_ROLE, (address ?? "0x0000000000000000000000000000000000000000") as Address],
    query: { enabled: isTokenConfigured && Boolean(address) },
  });

  const { data: hasMinterRoleRaw } = useReadContract({
    address: TOKEN_CONTRACT_ADDRESS,
    abi: WLG_TOKEN_ABI,
    functionName: "hasRole",
    args: [MINTER_ROLE, (address ?? "0x0000000000000000000000000000000000000000") as Address],
    query: { enabled: isTokenConfigured && Boolean(address) },
  });

  const { data: hasPauserRoleRaw } = useReadContract({
    address: TOKEN_CONTRACT_ADDRESS,
    abi: WLG_TOKEN_ABI,
    functionName: "hasRole",
    args: [PAUSER_ROLE, (address ?? "0x0000000000000000000000000000000000000000") as Address],
    query: { enabled: isTokenConfigured && Boolean(address) },
  });

  const hasReadIssue =
    Boolean(totalSupplyRead.error) ||
    Boolean(pausedRead.error) ||
    Boolean(burnEnabledRead.error) ||
    Boolean(pauseEnabledRead.error) ||
    Boolean(idoInventoryRead.error);

  const stats = useMemo(
    () => ({
      totalSupply: totalSupplyRaw ? formatUnits(totalSupplyRaw, 18) : "0",
      paused: Boolean(pausedRaw ?? false),
      burnEnabled: Boolean(burnEnabledRaw ?? false),
      pauseEnabled: Boolean(pauseEnabledRaw ?? false),
      idoInventory: idoInventoryRaw ? formatUnits(idoInventoryRaw, 18) : "0",
      hasAdminRole: Boolean(hasAdminRoleRaw ?? false),
      hasMinterRole: Boolean(hasMinterRoleRaw ?? false),
      hasPauserRole: Boolean(hasPauserRoleRaw ?? false),
    }),
    [
      totalSupplyRaw,
      pausedRaw,
      burnEnabledRaw,
      pauseEnabledRaw,
      idoInventoryRaw,
      hasAdminRoleRaw,
      hasMinterRoleRaw,
      hasPauserRoleRaw,
    ],
  );

  const runWrite = async (functionName: "mint" | "pause" | "unpause" | "setBurnEnabled" | "setPauseEnabled", args: readonly unknown[] = []) => {
    if (!address) throw new Error("Wallet not connected");
    if (!isTokenConfigured) throw new Error("Token contract address not configured");

    return writeContractAsync({
      address: TOKEN_CONTRACT_ADDRESS,
      abi: WLG_TOKEN_ABI,
      functionName,
      args,
    } as any);
  };

  const mint = async (to: string, amountWlg: string) => {
    if (!isAddress(to)) throw new Error("Invalid recipient address");
    return runWrite("mint", [to as Address, parseUnits(amountWlg, 18)]);
  };

  const pause = async () => runWrite("pause", []);
  const unpause = async () => runWrite("unpause", []);
  const setBurnEnabled = async (enabled: boolean) => runWrite("setBurnEnabled", [enabled]);
  const setPauseEnabled = async (enabled: boolean) => runWrite("setPauseEnabled", [enabled]);

  return {
    isTokenConfigured,
    stats,
    hasReadIssue,
    mint,
    pause,
    unpause,
    setBurnEnabled,
    setPauseEnabled,
  };
};

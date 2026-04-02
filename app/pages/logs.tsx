import { useEffect, useState } from "react";
import { GlassCard } from "../components/glass-card";
import { Filter, ShoppingCart, Send, TrendingUp, CheckCircle, Play, UserPlus, UserMinus, SlidersHorizontal } from "lucide-react";
import { usePublicClient } from "wagmi";
import { formatUnits } from "viem";
import { IDO_CONTRACT_ADDRESS, isContractsConfigured } from "../config/contracts";

interface ActivityEvent {
  id: number;
  type:
    | "TokensPurchased"
    | "TokensClaimed"
    | "TierPurchase"
    | "RequestCreated"
    | "Approved"
    | "Executed"
    | "SignerAdded"
    | "SignerRemoved"
    | "RequiredApprovalsUpdated";
  user: string;
  amount?: string;
  token?: string;
  tier?: number;
  previousApprovals?: number;
  newApprovals?: number;
  timestamp: string;
}

export function Logs() {
  const [filter, setFilter] = useState<string>("all");
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const publicClient = usePublicClient();

  useEffect(() => {
    const loadLogs = async () => {
      if (!publicClient || !isContractsConfigured) return;

      try {
        const fromBlock = 0n;
        const logs = await publicClient.getLogs({
          address: IDO_CONTRACT_ADDRESS,
          fromBlock,
          events: [
            {
              type: "event",
              name: "TokensPurchased",
              inputs: [
                { name: "buyer", type: "address", indexed: true },
                { name: "tokenAmount", type: "uint256", indexed: false },
                { name: "usdtSpent", type: "uint256", indexed: false },
              ],
            },
            {
              type: "event",
              name: "TokensClaimed",
              inputs: [
                { name: "claimer", type: "address", indexed: true },
                { name: "amount", type: "uint256", indexed: false },
              ],
            },
            {
              type: "event",
              name: "TierPurchase",
              inputs: [
                { name: "buyer", type: "address", indexed: true },
                { name: "tier", type: "uint256", indexed: false },
                { name: "amount", type: "uint256", indexed: false },
                { name: "price", type: "uint256", indexed: false },
              ],
            },
            {
              type: "event",
              name: "RequestCreated",
              inputs: [
                { name: "id", type: "uint256", indexed: true },
                { name: "token", type: "address", indexed: true },
                { name: "amount", type: "uint256", indexed: false },
                { name: "to", type: "address", indexed: true },
                { name: "purpose", type: "string", indexed: false },
              ],
            },
            {
              type: "event",
              name: "Approved",
              inputs: [
                { name: "id", type: "uint256", indexed: true },
                { name: "signer", type: "address", indexed: true },
              ],
            },
            {
              type: "event",
              name: "Executed",
              inputs: [
                { name: "id", type: "uint256", indexed: true },
                { name: "token", type: "address", indexed: true },
                { name: "amount", type: "uint256", indexed: false },
                { name: "to", type: "address", indexed: true },
              ],
            },
            {
              type: "event",
              name: "SignerAdded",
              inputs: [{ name: "account", type: "address", indexed: true }],
            },
            {
              type: "event",
              name: "SignerRemoved",
              inputs: [{ name: "account", type: "address", indexed: true }],
            },
            {
              type: "event",
              name: "RequiredApprovalsUpdated",
              inputs: [
                { name: "previousRequiredApprovals", type: "uint256", indexed: false },
                { name: "newRequiredApprovals", type: "uint256", indexed: false },
              ],
            },
          ],
        });

        const next = logs
          .map((log, index) => {
            const args = log.args as Record<string, unknown>;
            const timestamp = new Date().toLocaleString();

            if (log.eventName === "TokensPurchased") {
              return {
                id: index + 1,
                type: "TokensPurchased" as const,
                user: String(args.buyer ?? ""),
                amount: Number(formatUnits(BigInt(args.tokenAmount as bigint), 18)).toLocaleString(),
                timestamp,
              };
            }

            if (log.eventName === "TokensClaimed") {
              return {
                id: index + 1,
                type: "TokensClaimed" as const,
                user: String(args.claimer ?? ""),
                amount: Number(formatUnits(BigInt(args.amount as bigint), 18)).toLocaleString(),
                timestamp,
              };
            }

            if (log.eventName === "TierPurchase") {
              return {
                id: index + 1,
                type: "TierPurchase" as const,
                user: String(args.buyer ?? ""),
                tier: Number(args.tier ?? 0),
                amount: Number(formatUnits(BigInt(args.amount as bigint), 18)).toLocaleString(),
                timestamp,
              };
            }

            if (log.eventName === "RequestCreated") {
              return {
                id: index + 1,
                type: "RequestCreated" as const,
                user: String(args.to ?? ""),
                amount: Number(formatUnits(BigInt(args.amount as bigint), 6)).toLocaleString(),
                token: String(args.token ?? ""),
                timestamp,
              };
            }

            if (log.eventName === "Approved") {
              return {
                id: index + 1,
                type: "Approved" as const,
                user: String(args.signer ?? ""),
                timestamp,
              };
            }

            if (log.eventName === "SignerAdded") {
              return {
                id: index + 1,
                type: "SignerAdded" as const,
                user: String(args.account ?? ""),
                timestamp,
              };
            }

            if (log.eventName === "SignerRemoved") {
              return {
                id: index + 1,
                type: "SignerRemoved" as const,
                user: String(args.account ?? ""),
                timestamp,
              };
            }

            if (log.eventName === "RequiredApprovalsUpdated") {
              return {
                id: index + 1,
                type: "RequiredApprovalsUpdated" as const,
                user: "Owner",
                previousApprovals: Number(args.previousRequiredApprovals ?? 0n),
                newApprovals: Number(args.newRequiredApprovals ?? 0n),
                timestamp,
              };
            }

            return {
              id: index + 1,
              type: "Executed" as const,
              user: String(args.to ?? ""),
              amount: Number(formatUnits(BigInt((args.amount as bigint) ?? 0n), 6)).toLocaleString(),
              token: String(args.token ?? ""),
              timestamp,
            };
          })
          .reverse();

        setEvents(next);
      } catch {
        setEvents([]);
      }
    };

    loadLogs();
  }, [publicClient]);

  const eventTypes = [
    { value: "all", label: "All Events" },
    { value: "TokensPurchased", label: "Purchases" },
    { value: "TokensClaimed", label: "Claims" },
    { value: "TierPurchase", label: "Tier Changes" },
    { value: "RequestCreated", label: "Requests" },
    { value: "Approved", label: "Approvals" },
    { value: "Executed", label: "Executions" },
    { value: "SignerAdded", label: "Signer Added" },
    { value: "SignerRemoved", label: "Signer Removed" },
    { value: "RequiredApprovalsUpdated", label: "Threshold Updates" },
  ];

  const filteredEvents =
    filter === "all" ? events : events.filter((e) => e.type === filter);

  const getEventIcon = (type: string) => {
    switch (type) {
      case "TokensPurchased":
        return ShoppingCart;
      case "TokensClaimed":
        return Send;
      case "TierPurchase":
        return TrendingUp;
      case "RequestCreated":
        return Filter;
      case "Approved":
        return CheckCircle;
      case "Executed":
        return Play;
      case "SignerAdded":
        return UserPlus;
      case "SignerRemoved":
        return UserMinus;
      case "RequiredApprovalsUpdated":
        return SlidersHorizontal;
      default:
        return Filter;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "TokensPurchased":
        return "from-[#6C5CE7] to-[#8B7FF5]";
      case "TokensClaimed":
        return "from-[#00F5D4] to-[#33FFE8]";
      case "TierPurchase":
        return "from-[#6C5CE7] to-[#00F5D4]";
      case "RequestCreated":
        return "from-[#8B7FF5] to-[#6C5CE7]";
      case "Approved":
        return "from-[#00F5D4] to-[#6C5CE7]";
      case "Executed":
        return "from-[#6C5CE7] to-[#00F5D4]";
      case "SignerAdded":
        return "from-[#00F5D4] to-[#33FFE8]";
      case "SignerRemoved":
        return "from-[#FF6B6B] to-[#FF8787]";
      case "RequiredApprovalsUpdated":
        return "from-[#F59E0B] to-[#FCD34D]";
      default:
        return "from-white to-white";
    }
  };

  const getEventDescription = (event: ActivityEvent) => {
    switch (event.type) {
      case "TokensPurchased":
        return `Purchased ${event.amount} tokens`;
      case "TokensClaimed":
        return `Claimed ${event.amount} tokens`;
      case "TierPurchase":
        return `Entered Tier ${event.tier} with ${event.amount} tokens`;
      case "RequestCreated":
        return `Created withdrawal request for ${event.amount} ${event.token}`;
      case "Approved":
        return `Approved withdrawal request`;
      case "Executed":
        return `Executed withdrawal of ${event.amount} ${event.token}`;
      case "SignerAdded":
        return "Added signer wallet";
      case "SignerRemoved":
        return "Removed signer wallet";
      case "RequiredApprovalsUpdated":
        return `Updated required approvals from ${event.previousApprovals} to ${event.newApprovals}`;
      default:
        return "Unknown event";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl text-white mb-2">Transparency Log</h2>
          <p className="text-white/60">Recent contract events for fundraising, treasury, and mission governance</p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-white/60" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#6C5CE7] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50"
          >
            {eventTypes.map((type) => (
              <option key={type.value} value={type.value} className="bg-[#0B0F1A]">
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <GlassCard className="text-center">
          <p className="text-sm text-white/60 mb-1">Total Events</p>
          <p className="text-2xl text-white">{events.length}</p>
        </GlassCard>
        <GlassCard className="text-center">
          <p className="text-sm text-white/60 mb-1">Purchases</p>
          <p className="text-2xl text-white">
            {events.filter((e) => e.type === "TokensPurchased").length}
          </p>
        </GlassCard>
        <GlassCard className="text-center">
          <p className="text-sm text-white/60 mb-1">Claims</p>
          <p className="text-2xl text-white">
            {events.filter((e) => e.type === "TokensClaimed").length}
          </p>
        </GlassCard>
        <GlassCard className="text-center">
          <p className="text-sm text-white/60 mb-1">Executions</p>
          <p className="text-2xl text-white">
            {events.filter((e) => e.type === "Executed").length}
          </p>
        </GlassCard>
        <GlassCard className="text-center">
          <p className="text-sm text-white/60 mb-1">Signer Changes</p>
          <p className="text-2xl text-white">
            {events.filter((e) => e.type === "SignerAdded" || e.type === "SignerRemoved").length}
          </p>
        </GlassCard>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {filteredEvents.map((event, index) => {
          const Icon = getEventIcon(event.type);
          const gradient = getEventColor(event.type);

          return (
            <GlassCard key={event.id}>
              <div className="flex gap-4">
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} bg-opacity-20 flex items-center justify-center`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-white mb-1">{event.type}</h4>
                      <p className="text-sm text-white/60 mb-2">
                        {getEventDescription(event)}
                      </p>
                      <p className="text-xs text-white/40 font-mono break-all">
                        {event.user}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-white/60">{event.timestamp}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connection line to next event */}
              {index < filteredEvents.length - 1 && (
                <div className="ml-6 mt-4 h-8 border-l-2 border-dashed border-white/10" />
              )}
            </GlassCard>
          );
        })}
      </div>

      {filteredEvents.length === 0 && (
        <GlassCard className="text-center py-12">
          <Filter className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/60">No events found for this filter</p>
        </GlassCard>
      )}
    </div>
  );
}

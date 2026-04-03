import { useState } from "react";
import { GlassCard } from "../components/glass-card";
import { Wallet, Plus, CheckCircle, Clock, Send, User } from "lucide-react";
import { formatUnits } from "viem";
import { useIdoAdmin } from "../hooks/useIdoAdmin";
import { toast } from "sonner";
import { USDT_CONTRACT_ADDRESS, TOKEN_CONTRACT_ADDRESS } from "../config/contracts";

interface WithdrawRequest {
  id: number;
  token: string;
  tokenSymbol: string;
  amount: string;
  recipient: string;
  purpose: string;
  created: string;
  approvals: number;
  requiredApprovals: number;
  status: "Pending" | "Approved" | "Executed";
  approvers: { address: string; approved: boolean }[];
}

export function Treasury() {
  const {
    connectedRole,
    stats,
    requests: onChainRequests,
    approvalsByRequest,
    isLoadingRequests,
    createWithdrawRequest,
    approveWithdraw,
    withdrawToken,
  } = useIdoAdmin();

  const [tokenAddress, setTokenAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [purpose, setPurpose] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [approvingRequestId, setApprovingRequestId] = useState<number | null>(null);
  const [executingRequestId, setExecutingRequestId] = useState<number | null>(null);

  const signers = stats.signers.map((address, index) => ({
    address,
    name: index === 0 ? "Owner" : `Signer ${index}`,
  }));

  const requests: WithdrawRequest[] = onChainRequests.map((request) => {
    const tokenLower = request.token.toLowerCase();
    const tokenDecimals = tokenLower === USDT_CONTRACT_ADDRESS.toLowerCase() ? 6 : 18;
    const tokenSymbol = tokenLower === USDT_CONTRACT_ADDRESS.toLowerCase()
      ? "USDT"
      : tokenLower === TOKEN_CONTRACT_ADDRESS.toLowerCase()
      ? "WLG"
      : `${request.token.slice(0, 6)}...${request.token.slice(-4)}`;

    const approvals = Number(request.approvals);
    const requiredApprovals = stats.requiredApprovals || 1;
    const status: WithdrawRequest["status"] = request.executed
      ? "Executed"
      : approvals >= requiredApprovals
      ? "Approved"
      : "Pending";

    return {
      id: Number(request.id),
      token: request.token,
      tokenSymbol,
      amount: Number(formatUnits(request.amount, tokenDecimals)).toLocaleString(),
      recipient: request.to,
      purpose: request.purpose,
      created: new Date(Number(request.createdAt) * 1000).toLocaleString(),
      approvals,
      requiredApprovals,
      status,
      approvers: (approvalsByRequest[request.id.toString()] || []).map((entry) => ({
        address: entry.signer,
        approved: entry.approved,
      })),
    };
  });

  const handleCreateRequest = async () => {
    if (isCreating) return;

    try {
      setIsCreating(true);
      await createWithdrawRequest(tokenAddress, amount, recipient, purpose);
      toast.success("Withdraw request submitted");
      setTokenAddress("");
      setAmount("");
      setRecipient("");
      setPurpose("");
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Failed to create request";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    try {
      setApprovingRequestId(requestId);
      await approveWithdraw(requestId);
      toast.success("Approval submitted");
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Failed to approve request";
      toast.error(message);
    } finally {
      setApprovingRequestId(null);
    }
  };

  const handleExecute = async (requestId: number) => {
    try {
      setExecutingRequestId(requestId);
      await withdrawToken(requestId);
      toast.success("Withdraw execution submitted");
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Failed to execute withdrawal";
      toast.error(message);
    } finally {
      setExecutingRequestId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl text-white mb-2">Treasury Management</h2>
        <p className="text-white/60">
          Mission treasury multisig system - requires {stats.requiredApprovals} of {stats.signers.length} approvals
        </p>
      </div>

      {/* Create Withdraw Request */}
      <GlassCard>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6C5CE7]/20 flex items-center justify-center">
              <Plus className="w-5 h-5 text-[#6C5CE7]" />
            </div>
            <div>
              <h3 className="text-white">Create Withdraw Request</h3>
              <p className="text-sm text-white/60">Submit a charity treasury disbursement proposal</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Token Address</label>
              <input
                type="text"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-[#6C5CE7] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">Amount</label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-[#6C5CE7] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-white/60 mb-2">Recipient Address</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-[#6C5CE7] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 font-mono text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm text-white/60 mb-2">Purpose</label>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Describe the purpose of this withdrawal..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-[#6C5CE7] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 resize-none"
              />
            </div>
          </div>

          <button
            onClick={handleCreateRequest}
            disabled={isCreating}
            className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] text-white hover:shadow-[0_0_30px_rgba(108,92,231,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            {isCreating ? "Submitting..." : "Create Request"}
          </button>
        </div>
      </GlassCard>

      {/* Requests List */}
      <div className="space-y-4">
        <h3 className="text-xl text-white">Withdrawal Requests</h3>

        {isLoadingRequests && (
          <GlassCard>
            <p className="text-white/70">Loading on-chain requests...</p>
          </GlassCard>
        )}

        {requests.map((request) => (
          <GlassCard key={request.id} className="space-y-4">
            {/* Request Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/60">Request #{request.id}</span>
                  <span
                    className={`px-3 py-1 rounded-lg text-xs ${
                      request.status === "Executed"
                        ? "bg-[#00F5D4]/20 text-[#00F5D4]"
                        : request.status === "Approved"
                        ? "bg-[#6C5CE7]/20 text-[#6C5CE7]"
                        : "bg-white/10 text-white/60"
                    }`}
                  >
                    {request.status}
                  </span>
                </div>
                <p className="text-xs text-white/50">{request.created}</p>
              </div>

              <div className="text-right">
                <p className="text-2xl text-white">
                  ${request.amount} {request.tokenSymbol}
                </p>
                <p className="text-xs text-white/40 font-mono">{request.token}</p>
              </div>
            </div>

            {/* Request Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-white/5">
              <div>
                <p className="text-xs text-white/60 mb-1">Recipient</p>
                <p className="text-sm text-white font-mono break-all">{request.recipient}</p>
              </div>
              <div>
                <p className="text-xs text-white/60 mb-1">Purpose</p>
                <p className="text-sm text-white">{request.purpose}</p>
              </div>
            </div>

            {/* Approval Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Approval Progress</span>
                <span className="text-sm text-white">
                  {request.approvals} / {request.requiredApprovals} signatures
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4]"
                  style={{ width: `${(request.approvals / request.requiredApprovals) * 100}%` }}
                />
              </div>

              {/* Approvers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {request.approvers.map((approver) => (
                  <div
                    key={approver.address}
                    className={`flex items-center gap-2 p-3 rounded-lg ${
                      approver.approved ? "bg-[#00F5D4]/10" : "bg-white/5"
                    }`}
                  >
                    {approver.approved ? (
                      <CheckCircle className="w-4 h-4 text-[#00F5D4]" />
                    ) : (
                      <Clock className="w-4 h-4 text-white/40" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/60">
                        {signers.find((s) => s.address === approver.address)?.name}
                      </p>
                      <p className="text-xs text-white/40 font-mono truncate">{approver.address}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            {request.status !== "Executed" && (
              <div className="flex gap-3">
                {request.approvals < request.requiredApprovals && (
                  <button
                    onClick={() => handleApprove(request.id)}
                    disabled={approvingRequestId === request.id || executingRequestId === request.id}
                    className="flex-1 px-4 py-3 rounded-xl bg-[#6C5CE7]/20 text-[#6C5CE7] border border-[#6C5CE7]/30 hover:bg-[#6C5CE7]/30 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {approvingRequestId === request.id ? "Approving..." : "Approve"}
                  </button>
                )}
                {request.approvals >= request.requiredApprovals && (
                  <div className="flex-1 space-y-2">
                    <button
                      onClick={() => handleExecute(request.id)}
                      disabled={
                        connectedRole !== "Owner" ||
                        executingRequestId === request.id ||
                        approvingRequestId === request.id
                      }
                      className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] text-white hover:shadow-[0_0_30px_rgba(108,92,231,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                      {executingRequestId === request.id ? "Executing..." : "Execute Withdrawal"}
                    </button>
                    {connectedRole !== "Owner" && (
                      <p className="text-xs text-yellow-300 text-center">
                        Owner wallet required to execute transfer after approvals.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

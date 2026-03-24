import { useEffect, useState } from "react";
import { GlassCard } from "../components/glass-card";
import { Play, Pause, Clock, Send, UserPlus, UserMinus, AlertCircle } from "lucide-react";
import { ToggleSwitch } from "../components/toggle-switch";
import { ConfirmModal } from "../components/confirm-modal";
import { useIdoAdmin } from "../hooks/useIdoAdmin";
import { useWlgTokenAdmin } from "../hooks/useWlgTokenAdmin";
import { IDO_CONTRACT_ADDRESS, TOKEN_CONTRACT_ADDRESS } from "../config/contracts";
import { useChainId } from "wagmi";
import { toast } from "sonner";

export function Controls() {
  const chainId = useChainId();
  const {
    connectedRole,
    stats,
    hasReadIssue: hasIdoReadIssue,
    setBuyPaused: setBuyPausedOnChain,
    setClaimPaused: setClaimPausedOnChain,
    setSaleHasEnd,
    setSaleTimes,
    release,
    addAdmin,
    removeAdmin,
    addSigner,
    removeSigner,
    setRequiredApprovals,
  } = useIdoAdmin();
  const {
    isTokenConfigured,
    stats: tokenStats,
    hasReadIssue: hasTokenReadIssue,
    mint,
    pause,
    unpause,
    setBurnEnabled,
    setPauseEnabled,
  } = useWlgTokenAdmin();

  const [buyPaused, setBuyPaused] = useState(false);
  const [claimPaused, setClaimPaused] = useState(false);
  const [saleHasEnd, setSaleHasEndState] = useState(false);
  const [startTime, setStartTime] = useState("2026-03-21T10:00");
  const [endTime, setEndTime] = useState("2026-04-21T10:00");
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);
  const [removeAdminModal, setRemoveAdminModal] = useState<string | null>(null);
  const [removeSignerModal, setRemoveSignerModal] = useState<string | null>(null);
  const [newAdminAddress, setNewAdminAddress] = useState("");
  const [newSignerAddress, setNewSignerAddress] = useState("");
  const [requiredApprovalsInput, setRequiredApprovalsInput] = useState("1");
  const [mintTo, setMintTo] = useState("");
  const [mintAmount, setMintAmount] = useState("");
  const hasAnyReadIssue = hasIdoReadIssue || (isTokenConfigured && hasTokenReadIssue);

  useEffect(() => {
    setBuyPaused(stats.isBuyPaused);
    setClaimPaused(stats.isClaimPaused);
    setSaleHasEndState(stats.saleHasEnd);

    if (stats.startTime > 0) {
      setStartTime(new Date(stats.startTime * 1000).toISOString().slice(0, 16));
    }
    if (stats.endTime > 0) {
      setEndTime(new Date(stats.endTime * 1000).toISOString().slice(0, 16));
    }
    setRequiredApprovalsInput(String(stats.requiredApprovals || 1));
  }, [stats.isBuyPaused, stats.isClaimPaused, stats.saleHasEnd, stats.startTime, stats.endTime, stats.requiredApprovals]);

  const admins = stats.admins.map((address) => ({ address, addedDate: "On-chain" }));
  const signers = stats.signers.map((address) => ({ address, addedDate: "On-chain" }));

  const handleReleaseTokens = async () => {
    try {
      await release();
      toast.success("Release transaction submitted");
      setReleaseModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to release tokens");
    }
  };

  const handleAddAdmin = async () => {
    if (newAdminAddress) {
      try {
        await addAdmin(newAdminAddress);
        toast.success("Add admin transaction submitted");
        setNewAdminAddress("");
      } catch (error) {
        console.error(error);
        toast.error("Failed to add admin");
      }
    }
  };

  const handleRemoveAdmin = async (address: string) => {
    try {
      await removeAdmin(address);
      toast.success("Remove admin transaction submitted");
      setRemoveAdminModal(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove admin");
    }
  };

  const handleAddSigner = async () => {
    if (newSignerAddress) {
      try {
        await addSigner(newSignerAddress);
        toast.success("Add signer transaction submitted");
        setNewSignerAddress("");
      } catch (error) {
        console.error(error);
        toast.error("Failed to add signer");
      }
    }
  };

  const handleRemoveSigner = async (address: string) => {
    try {
      await removeSigner(address);
      toast.success("Remove signer transaction submitted");
      setRemoveSignerModal(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove signer");
    }
  };

  const handleSetRequiredApprovals = async () => {
    try {
      const value = Number(requiredApprovalsInput);
      await setRequiredApprovals(value);
      toast.success("Required approvals update submitted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update required approvals");
    }
  };

  const handleSetBuyPaused = async (value: boolean) => {
    const prev = buyPaused;
    setBuyPaused(value);
    try {
      await setBuyPausedOnChain(value);
      toast.success("Buy pause updated");
    } catch (error) {
      console.error(error);
      setBuyPaused(prev);
      toast.error("Failed to update buy pause");
    }
  };

  const handleSetClaimPaused = async (value: boolean) => {
    const prev = claimPaused;
    setClaimPaused(value);
    try {
      await setClaimPausedOnChain(value);
      toast.success("Claim pause updated");
    } catch (error) {
      console.error(error);
      setClaimPaused(prev);
      toast.error("Failed to update claim pause");
    }
  };

  const handleUpdateSaleTimes = async () => {
    if (!saleHasEnd) {
      toast.info("Sale ending is disabled");
      return;
    }

    try {
      const start = Math.floor(new Date(startTime).getTime() / 1000);
      const end = Math.floor(new Date(endTime).getTime() / 1000);
      await setSaleTimes(start, end);
      toast.success("Sale times update submitted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update sale times");
    }
  };

  const handleSetSaleHasEnd = async (value: boolean) => {
    const prev = saleHasEnd;
    setSaleHasEndState(value);

    try {
      await setSaleHasEnd(value);
      toast.success(value ? "Sale end enabled" : "No-ending mode enabled");
    } catch (error) {
      console.error(error);
      setSaleHasEndState(prev);
      toast.error("Failed to update sale end mode");
    }
  };

  const handleMint = async () => {
    try {
      await mint(mintTo, mintAmount);
      toast.success("Mint transaction submitted");
      setMintTo("");
      setMintAmount("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to mint token");
    }
  };

  const handlePauseToken = async () => {
    try {
      await pause();
      toast.success("Token pause transaction submitted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to pause token");
    }
  };

  const handleUnpauseToken = async () => {
    try {
      await unpause();
      toast.success("Token unpause transaction submitted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to unpause token");
    }
  };

  const handleSetBurnEnabled = async (enabled: boolean) => {
    try {
      await setBurnEnabled(enabled);
      toast.success(`Burn ${enabled ? "enabled" : "disabled"}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update burn setting");
    }
  };

  const handleSetPauseEnabled = async (enabled: boolean) => {
    try {
      await setPauseEnabled(enabled);
      toast.success(`Pause control ${enabled ? "enabled" : "disabled"}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update pause setting");
    }
  };

  return (
    <div className="space-y-8">
      {hasAnyReadIssue && (
        <GlassCard>
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-2">
            <p className="text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Some on-chain admin data could not be loaded.
            </p>
            <p className="text-xs text-amber-100/90">
              This usually means contract address or network mismatch. Verify your Vercel env addresses and connect MetaMask to the deployment network.
            </p>
            <div className="text-xs text-amber-100/90 space-y-1 font-mono break-all">
              <p>Connected chain id: {chainId}</p>
              <p>IDO contract: {IDO_CONTRACT_ADDRESS}</p>
              <p>Token contract: {TOKEN_CONTRACT_ADDRESS}</p>
            </div>
          </div>
        </GlassCard>
      )}

      <div>
        <h2 className="text-2xl text-white mb-2">Sale Control Panel</h2>
        <p className="text-white/60">Manage sale parameters and administrative access</p>
      </div>

      {/* Sale Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pause Controls */}
        <GlassCard>
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#6C5CE7]/20 flex items-center justify-center">
                {buyPaused ? <Pause className="w-5 h-5 text-[#6C5CE7]" /> : <Play className="w-5 h-5 text-[#00F5D4]" />}
              </div>
              <div>
                <h3 className="text-white">Pause Controls</h3>
                <p className="text-sm text-white/60">Toggle buying and claiming</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <p className="text-white">Buy Paused</p>
                  <p className="text-xs text-white/60">Prevent new token purchases</p>
                </div>
                <ToggleSwitch
                  checked={buyPaused}
                  onChange={handleSetBuyPaused}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <p className="text-white">Claim Paused</p>
                  <p className="text-xs text-white/60">Prevent token claiming</p>
                </div>
                <ToggleSwitch
                  checked={claimPaused}
                  onChange={handleSetClaimPaused}
                />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Sale Time */}
        <GlassCard>
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00F5D4]/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#00F5D4]" />
              </div>
              <div>
                <h3 className="text-white">Sale Time</h3>
                <p className="text-sm text-white/60">Set start and end times</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <p className="text-white">Sale Has End</p>
                  <p className="text-xs text-white/60">Disable for no-ending sale mode</p>
                </div>
                <ToggleSwitch
                  checked={saleHasEnd}
                  onChange={handleSetSaleHasEnd}
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Start Time</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#6C5CE7] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50"
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">End Time</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                    disabled={!saleHasEnd}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#6C5CE7] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50"
                />
              </div>

              <button
                onClick={handleUpdateSaleTimes}
                disabled={!saleHasEnd}
                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] text-white hover:shadow-[0_0_30px_rgba(108,92,231,0.5)] transition-all"
              >
                Update Sale Times
              </button>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Release Tokens */}
      <GlassCard className="border-[#6C5CE7]/30">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-[#6C5CE7] flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-white mb-2">Release Tokens</h3>
            <p className="text-sm text-white/60 mb-4">
              Distribute tokens to all eligible participants. This action will process all pending claims.
              Ensure all parameters are correct before proceeding.
            </p>
            <button
              onClick={() => setReleaseModalOpen(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] text-white hover:shadow-[0_0_30px_rgba(108,92,231,0.5)] transition-all flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Release Tokens
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Admin Management */}
      <GlassCard>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6C5CE7]/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-[#6C5CE7]" />
            </div>
            <div>
              <h3 className="text-white">Admin Management</h3>
              <p className="text-sm text-white/60">Add or remove platform administrators</p>
            </div>
          </div>

          {/* Add Admin */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newAdminAddress}
              onChange={(e) => setNewAdminAddress(e.target.value)}
              placeholder="0x... wallet address"
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-[#6C5CE7] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 font-mono text-sm"
            />
            <button
              onClick={handleAddAdmin}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] text-white hover:shadow-[0_0_30px_rgba(108,92,231,0.5)] transition-all flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Add Admin
            </button>
          </div>

          {/* Admin List */}
          <div className="space-y-3">
            <p className="text-sm text-white/60">Current Admins ({admins.length})</p>
            {admins.map((admin) => (
              <div
                key={admin.address}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div>
                  <p className="text-white font-mono text-sm">{admin.address}</p>
                  <p className="text-xs text-white/50">Added on {admin.addedDate}</p>
                </div>
                <button
                  onClick={() => setRemoveAdminModal(admin.address)}
                  className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Signer Management */}
      <GlassCard>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00F5D4]/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-[#00F5D4]" />
            </div>
            <div>
              <h3 className="text-white">Signer Management</h3>
              <p className="text-sm text-white/60">Manage co-signer wallets and approval threshold</p>
            </div>
          </div>

          {connectedRole === "Owner" ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  type="number"
                  min={1}
                  value={requiredApprovalsInput}
                  onChange={(e) => setRequiredApprovalsInput(e.target.value)}
                  placeholder="Required approvals"
                  className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-[#6C5CE7] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50"
                />
                <div className="md:col-span-2">
                  <button
                    onClick={handleSetRequiredApprovals}
                    className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] text-white hover:shadow-[0_0_30px_rgba(108,92,231,0.5)] transition-all"
                  >
                    Update Required Approvals
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSignerAddress}
                  onChange={(e) => setNewSignerAddress(e.target.value)}
                  placeholder="0x... signer wallet"
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-[#6C5CE7] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 font-mono text-sm"
                />
                <button
                  onClick={handleAddSigner}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#00F5D4] to-[#6C5CE7] text-white hover:shadow-[0_0_30px_rgba(0,245,212,0.35)] transition-all flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Signer
                </button>
              </div>
            </>
          ) : (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm text-amber-200">
              Signer management is owner-only. Connect the owner wallet to add/remove signers or change required approvals.
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm text-white/60">
              Current Signers ({signers.length}) | Required Approvals ({stats.requiredApprovals})
            </p>
            {signers.map((signer) => (
              <div
                key={signer.address}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div>
                  <p className="text-white font-mono text-sm">{signer.address}</p>
                  <p className="text-xs text-white/50">Added on {signer.addedDate}</p>
                </div>
                <button
                  onClick={() => setRemoveSignerModal(signer.address)}
                  disabled={connectedRole !== "Owner"}
                  className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Token Contract Controls */}
      <GlassCard>
        <div className="space-y-6">
          <div>
            <h3 className="text-white">WLG Token Contract</h3>
            <p className="text-sm text-white/60">Read and execute token admin functions from /ido-admin</p>
          </div>

          {!isTokenConfigured ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-300">
              Missing VITE_TOKEN_CONTRACT_ADDRESS in environment config.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs text-white/60 mb-1">Total Supply</p>
                  <p className="text-white">{Number(tokenStats.totalSupply).toLocaleString()} WLG</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs text-white/60 mb-1">IDO Inventory</p>
                  <p className="text-white">{Number(tokenStats.idoInventory).toLocaleString()} WLG</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs text-white/60 mb-1">Token Status</p>
                  <p className="text-white">{tokenStats.paused ? "Paused" : "Active"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/80">
                  Admin Role: {tokenStats.hasAdminRole ? "Yes" : "No"}
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/80">
                  Minter Role: {tokenStats.hasMinterRole ? "Yes" : "No"}
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/80">
                  Pauser Role: {tokenStats.hasPauserRole ? "Yes" : "No"}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={handlePauseToken}
                  className="px-4 py-3 rounded-xl bg-[#6C5CE7]/20 text-[#6C5CE7] border border-[#6C5CE7]/30 hover:bg-[#6C5CE7]/30 transition-all"
                >
                  Pause Token
                </button>
                <button
                  onClick={handleUnpauseToken}
                  className="px-4 py-3 rounded-xl bg-[#00F5D4]/20 text-[#00F5D4] border border-[#00F5D4]/30 hover:bg-[#00F5D4]/30 transition-all"
                >
                  Unpause Token
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => handleSetBurnEnabled(!tokenStats.burnEnabled)}
                  className="px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/15 transition-all"
                >
                  {tokenStats.burnEnabled ? "Disable Burn" : "Enable Burn"}
                </button>
                <button
                  onClick={() => handleSetPauseEnabled(!tokenStats.pauseEnabled)}
                  className="px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/15 transition-all"
                >
                  {tokenStats.pauseEnabled ? "Disable Pause Control" : "Enable Pause Control"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={mintTo}
                  onChange={(e) => setMintTo(e.target.value)}
                  placeholder="Mint recipient (0x...)"
                  className="md:col-span-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-[#6C5CE7] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 font-mono text-sm"
                />
                <input
                  type="text"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(e.target.value)}
                  placeholder="Amount (WLG)"
                  className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-[#6C5CE7] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50"
                />
              </div>
              <button
                onClick={handleMint}
                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] text-white hover:shadow-[0_0_30px_rgba(108,92,231,0.5)] transition-all"
              >
                Mint WLG
              </button>
            </>
          )}
        </div>
      </GlassCard>

      {/* Modals */}
      <ConfirmModal
        isOpen={releaseModalOpen}
        onClose={() => setReleaseModalOpen(false)}
        onConfirm={handleReleaseTokens}
        title="Release Tokens"
        description="Are you sure you want to release tokens to all eligible participants? This action cannot be undone."
        confirmText="Release Tokens"
        variant="primary"
      />

      {removeAdminModal && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setRemoveAdminModal(null)}
          onConfirm={() => handleRemoveAdmin(removeAdminModal)}
          title="Remove Admin"
          description={`Are you sure you want to remove admin access for ${removeAdminModal}?`}
          confirmText="Remove Admin"
          variant="destructive"
        />
      )}

      {removeSignerModal && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setRemoveSignerModal(null)}
          onConfirm={() => handleRemoveSigner(removeSignerModal)}
          title="Remove Signer"
          description={`Are you sure you want to remove signer access for ${removeSignerModal}?`}
          confirmText="Remove Signer"
          variant="destructive"
        />
      )}
    </div>
  );
}

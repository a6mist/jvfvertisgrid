import { useState } from "react";
import { GlassCard } from "./glass-card";
import { Bug, ChevronDown, ChevronUp } from "lucide-react";
import { useIdoAdmin } from "../hooks/useIdoAdmin";

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { isContractsConfigured, stats } = useIdoAdmin();

  const debugData = {
    currentTimestamp: Math.floor(Date.now() / 1000),
    contractsConfigured: isContractsConfigured,
    saleStartTime: stats.startTime,
    saleEndTime: stats.endTime,
    isSaleActive:
      stats.startTime > 0 &&
      stats.endTime > 0 &&
      Math.floor(Date.now() / 1000) >= stats.startTime &&
      Math.floor(Date.now() / 1000) <= stats.endTime,
    totalSold: stats.totalSold,
    totalUsdtCollected: stats.totalUsdtCollected,
    maxTokens: stats.maxTokens,
    currentTier: stats.currentTier,
    currentPrice: stats.currentPrice,
    buyPaused: stats.isBuyPaused,
    claimPaused: stats.isClaimPaused,
    released: stats.released,
    adminCount: stats.admins.length,
    signerCount: stats.signers.length,
    requiredApprovals: stats.requiredApprovals,
  };

  return (
    <GlassCard className="border-[#00F5D4]/30">
      <div className="space-y-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00F5D4]/20 flex items-center justify-center">
              <Bug className="w-5 h-5 text-[#00F5D4]" />
            </div>
            <div className="text-left">
              <h3 className="text-white">Debug Panel</h3>
              <p className="text-sm text-white/60">Development mode information</p>
            </div>
          </div>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-white/60" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white/60" />
          )}
        </button>

        {isOpen && (
          <div className="pt-4 border-t border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-sm">
              {Object.entries(debugData).map(([key, value]) => (
                <div key={key} className="p-3 rounded-lg bg-white/5">
                  <p className="text-white/60 text-xs mb-1">{key}</p>
                  <p className="text-white break-all">
                    {typeof value === "boolean" ? (
                      <span className={value ? "text-[#00F5D4]" : "text-red-400"}>
                        {value.toString()}
                      </span>
                    ) : (
                      value
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

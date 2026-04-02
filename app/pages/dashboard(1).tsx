import { TrendingUp, DollarSign, Coins, Zap, Clock, Users, Shield, AlertTriangle } from "lucide-react";
import { GlassCard } from "../components/glass-card";
import { StatCard } from "../components/stat-card";
import { ProgressBar } from "../components/progress-bar";
import { RoleBadge } from "../components/role-badge";
import { DebugPanel } from "../components/debug-panel";
import { AnimatedSection } from "../components/animated-section";
import { useEffect, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { useIdoAdmin } from "../hooks/useIdoAdmin";
import { IDO_CONTRACT_ADDRESS } from "../config/contracts";

export function Dashboard() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { stats: chainStats, connectedRole, isContractsConfigured } = useIdoAdmin();
  const hasSaleEnding = chainStats.saleHasEnd;
  const [timeLeft, setTimeLeft] = useState({
    days: 12,
    hours: 5,
    minutes: 32,
    seconds: 45,
  });

  useEffect(() => {
    if (!chainStats.endTime || !hasSaleEnding) return;

    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = Math.max(chainStats.endTime - now, 0);

      const days = Math.floor(remaining / (24 * 60 * 60));
      const hours = Math.floor((remaining % (24 * 60 * 60)) / (60 * 60));
      const minutes = Math.floor((remaining % (60 * 60)) / 60);
      const seconds = remaining % 60;

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [chainStats.endTime, hasSaleEnding]);

  const stats = {
    totalSold: Number(chainStats.totalSold || "0"),
    maxTokens: Number(chainStats.maxTokens || "0"),
    totalUSDT: Number(chainStats.totalUsdtCollected || "0"),
    currentTier: chainStats.currentTier,
    currentPrice: Number(chainStats.currentPrice || "0"),
    saleStatus: !isContractsConfigured ? "Not Configured" : chainStats.isBuyPaused ? "Paused" : "Active",
    walletAddress: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected",
    userRole: connectedRole,
  };

  const progressPercent = stats.maxTokens > 0 ? (stats.totalSold / stats.maxTokens) * 100 : 0;
  const charityPoolEstimate = stats.totalUSDT * 0.15;
  const networkLabel = chainId ? `Chain ID ${chainId}` : "Unknown network";
  const contractLabel = `${IDO_CONTRACT_ADDRESS.slice(0, 6)}...${IDO_CONTRACT_ADDRESS.slice(-4)}`;

  return (
    <div className="space-y-8">
      <AnimatedSection delay={0.05}>
        <GlassCard className="border-emerald-400/30 bg-emerald-500/10">
          <p className="text-sm text-emerald-200">Estimated Charity Allocation (15% of total USDT)</p>
          <p className="mt-1 text-3xl font-bold text-emerald-300">${charityPoolEstimate.toLocaleString()}</p>
        </GlassCard>
      </AnimatedSection>

      {/* Access Control */}
      <AnimatedSection delay={0.1}>
        <GlassCard className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#6C5CE7]/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-[#6C5CE7]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white/60">Connected as</span>
                <RoleBadge role={stats.userRole} />
              </div>
              <p className="text-sm text-white/80 font-mono">{stats.walletAddress}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[#00F5D4]">
            <div className="w-2 h-2 rounded-full bg-[#00F5D4] animate-pulse" />
            <span className="text-sm">{isConnected ? "Connected" : "Disconnected"}</span>
          </div>
        </GlassCard>
      </AnimatedSection>

      {/* Security Warning */}
      <AnimatedSection delay={0.2}>
        <GlassCard className="border-[#6C5CE7]/30">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-[#6C5CE7] flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-white">Security Reminders</h4>
              <ul className="text-sm text-white/70 space-y-1">
                <li>• All actions require wallet confirmation</li>
                <li>• Transactions are irreversible - verify all details carefully</li>
                <li>• Never share your private keys or seed phrase</li>
                {!isContractsConfigured && <li>• Contract address env is not configured, admin data may show as zero</li>}
              </ul>
            </div>
          </div>
        </GlassCard>
      </AnimatedSection>

      {/* Integration Status */}
      <AnimatedSection delay={0.25}>
        <GlassCard>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-white/60 mb-1">Network</p>
              <p className="text-white">{networkLabel}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-white/60 mb-1">Wallet</p>
              <p className="text-white font-mono">{isConnected && address ? `${address.slice(0, 8)}...${address.slice(-6)}` : "Not connected"}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-white/60 mb-1">IDO Contract</p>
              <p className="text-white font-mono">{isContractsConfigured ? contractLabel : "Not configured"}</p>
            </div>
          </div>
        </GlassCard>
      </AnimatedSection>

      {/* Main Stats */}
      <AnimatedSection delay={0.3}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Tokens Sold"
            value={stats.totalSold.toLocaleString()}
            subtitle={`of ${stats.maxTokens.toLocaleString()}`}
            icon={Coins}
            color="purple"
          />
          <StatCard
            title="Total USDT Collected"
            value={`$${stats.totalUSDT.toLocaleString()}`}
            subtitle="Total raised"
            icon={DollarSign}
            color="aqua"
          />
          <StatCard
            title="Current Tier"
            value={stats.currentTier.toString()}
            subtitle={`Price: $${stats.currentPrice}`}
            icon={TrendingUp}
            color="purple"
          />
          <StatCard
            title="Sale Status"
            value={stats.saleStatus}
            subtitle={!isContractsConfigured ? "Set contract env vars" : "Live and active"}
            icon={Zap}
            color="aqua"
            pulse
          />
        </div>
      </AnimatedSection>

      {/* Progress Bar */}
      <AnimatedSection delay={0.4}>
        <GlassCard>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white">Sale Progress</h3>
              <span className="text-sm text-white/60">
                  {progressPercent.toFixed(2)}% Complete
              </span>
            </div>
            <ProgressBar current={stats.totalSold} max={stats.maxTokens} />
            <div className="flex justify-between text-sm text-white/60">
              <span>{stats.totalSold.toLocaleString()} Sold</span>
              <span>{stats.maxTokens.toLocaleString()} Max</span>
            </div>
          </div>
        </GlassCard>
      </AnimatedSection>

      {/* Countdown Timer */}
      <AnimatedSection delay={0.5}>
        <GlassCard>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <Clock className="w-5 h-5 text-[#00F5D4]" />
              <h3>{hasSaleEnding ? "Sale Ends In" : "Sale Ends"}</h3>
            </div>
            {hasSaleEnding ? (
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "Days", value: timeLeft.days },
                  { label: "Hours", value: timeLeft.hours },
                  { label: "Minutes", value: timeLeft.minutes },
                  { label: "Seconds", value: timeLeft.seconds },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="text-center p-4 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="text-3xl font-bold bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] bg-clip-text text-transparent">
                      {item.value.toString().padStart(2, "0")}
                    </div>
                    <div className="text-xs text-white/60 mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-white/5 border border-white/10 text-center">
                <p className="text-3xl font-bold bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] bg-clip-text text-transparent">No ending</p>
                <p className="text-sm text-white/60 mt-1">Sale end is disabled</p>
              </div>
            )}
          </div>
        </GlassCard>
      </AnimatedSection>

      {/* Additional Stats */}
      <AnimatedSection delay={0.6}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#6C5CE7]/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-[#6C5CE7]" />
              </div>
              <div>
                <p className="text-sm text-white/60">Total Participants</p>
                <p className="text-2xl text-white">{chainStats.totalParticipants.toLocaleString()}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#00F5D4]/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#00F5D4]" />
              </div>
              <div>
                <p className="text-sm text-white/60">Average Purchase</p>
                <p className="text-2xl text-white">${Number(chainStats.averagePurchase || "0").toFixed(2)}</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </AnimatedSection>

      {/* Debug Panel */}
      <AnimatedSection delay={0.7}>
        <DebugPanel />
      </AnimatedSection>
    </div>
  );
}
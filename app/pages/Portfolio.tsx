import { useEffect, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { GlassCard } from '../components/GlassCard';
import { useIdoContract, type PortfolioActivityItem } from '../hooks/useContract';
import { Wallet, TrendingUp, Clock, CheckCircle, Gift, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const Portfolio = () => {
  const { address, isConnected } = useAccount();
  const { stats, claimTokens, getUserActivity } = useIdoContract();
  const [isClaiming, setIsClaiming] = useState(false);
  const [activity, setActivity] = useState<PortfolioActivityItem[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadActivity = async () => {
      if (!isConnected || !address) {
        setActivity([]);
        return;
      }

      setIsLoadingActivity(true);
      const events = await getUserActivity(address);
      if (!cancelled) {
        setActivity(events);
        setIsLoadingActivity(false);
      }
    };

    void loadActivity();

    return () => {
      cancelled = true;
    };
  }, [address, isConnected]);

  const handleClaim = async () => {
    if (!isConnected) return;

    setIsClaiming(true);
    try {
      const hash = await claimTokens();
      toast.success('Tokens claimed successfully!');
      console.log('Claim TX:', hash);
    } catch (error) {
      toast.error('Claim failed. Please try again.');
      console.error('Claim error:', error);
    } finally {
      setIsClaiming(false);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'Unknown time';
    return new Date(timestamp * 1000).toLocaleString();
  };

  const purchaseTotals = useMemo(() => {
    return activity.reduce(
      (acc, item) => {
        if (item.type !== 'purchase') return acc;
        acc.tokens += parseFloat(item.amount || '0');
        acc.usdt += parseFloat(item.usdtAmount || '0');
        return acc;
      },
      { tokens: 0, usdt: 0 },
    );
  }, [activity]);

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <GlassCard className="text-center py-12">
          <Wallet className="w-16 h-16 text-[#6C5CE7] mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400">
            Please connect your wallet to view your portfolio
          </p>
        </GlassCard>
      </div>
    );
  }

  const totalTokens = parseFloat(stats.userPurchased || '0');
  const currentPrice = parseFloat(stats.currentPrice || '0');
  const avgBuyPrice =
    purchaseTotals.tokens > 0 ? purchaseTotals.usdt / purchaseTotals.tokens : currentPrice;
  const gainPercent = avgBuyPrice > 0 ? ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100 : 0;
  const totalValue = totalTokens * currentPrice;
  const claimProgress = stats.userClaimed ? 100 : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          <span className="bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] bg-clip-text text-transparent">
            My Portfolio
          </span>
        </h1>
        <p className="text-gray-400">Manage your tokens and track your investments</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <GlassCard glow>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Tokens</p>
              <p className="text-3xl font-bold text-[#00F5D4] mb-1">
                {totalTokens.toLocaleString()}
              </p>
              <p className="text-sm text-gray-400">WLG Tokens</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#6C5CE7]/20 to-[#00F5D4]/20">
              <Gift className="w-6 h-6 text-[#00F5D4]" />
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Current Value</p>
              <p className="text-3xl font-bold mb-1">${totalValue.toFixed(2)}</p>
              <p className={`text-sm ${gainPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {gainPercent >= 0 ? '+' : ''}
                {gainPercent.toFixed(2)}% vs avg buy
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#6C5CE7]/20 to-[#00F5D4]/20">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">Avg. Buy Price</p>
              <p className="text-3xl font-bold mb-1">${avgBuyPrice.toFixed(6)}</p>
              <p className="text-sm text-gray-400">per token</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#6C5CE7]/20 to-[#00F5D4]/20">
              <Wallet className="w-6 h-6 text-[#6C5CE7]" />
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Claim Section */}
          <GlassCard glow={!stats.userClaimed}>
            <div className="flex items-center gap-2 mb-6">
              <Gift className="w-6 h-6 text-[#00F5D4]" />
              <h2 className="text-2xl font-semibold">Claim Your Tokens</h2>
            </div>

            {stats.userClaimed ? (
              <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/30 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <h3 className="text-xl font-semibold mb-2">Already Claimed!</h3>
                <p className="text-gray-400">
                  You have successfully claimed your tokens
                </p>
              </div>
            ) : (
              <div>
                <div className="p-6 rounded-xl bg-gradient-to-r from-[#6C5CE7]/10 to-[#00F5D4]/10 border border-[#6C5CE7]/30 mb-6">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Available to Claim</p>
                      <p className="text-2xl font-bold text-[#00F5D4]">
                        {stats.userClaimed ? '0' : totalTokens.toLocaleString()} WLG
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Claim Status</p>
                      <p className="text-2xl font-bold">
                        {stats.userClaimed ? 'Claimed' : 'Pending'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Claim Progress</span>
                      <span className="text-[#00F5D4]">{claimProgress}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4]"
                        style={{ width: `${claimProgress}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Claim availability is enforced by on-chain sale and release settings.
                  </p>
                </div>

                <button
                  onClick={handleClaim}
                  disabled={isClaiming}
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] hover:shadow-[0_0_40px_rgba(108,92,231,0.6)] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isClaiming ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    <>
                      <Gift className="w-5 h-5" />
                      Claim Available Tokens
                    </>
                  )}
                </button>
              </div>
            )}
          </GlassCard>

          {/* Transaction History */}
          <GlassCard>
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-6 h-6 text-[#00F5D4]" />
              <h2 className="text-2xl font-semibold">Transaction History</h2>
            </div>

            <div className="space-y-3">
              {isLoadingActivity && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-sm">
                  Loading on-chain history...
                </div>
              )}

              {!isLoadingActivity && activity.length === 0 && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-sm">
                  No on-chain transactions found for this wallet yet.
                </div>
              )}

              {activity.map((tx, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#6C5CE7]/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{tx.type === 'purchase' ? 'Purchase' : 'Claim'}</p>
                      <p className="text-sm text-gray-400">{formatDate(tx.timestamp)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#00F5D4]">
                        {parseFloat(tx.amount).toLocaleString()} WLG
                      </p>
                      <p className="text-sm text-gray-400">
                        {tx.type === 'purchase' ? `$${parseFloat(tx.usdtAmount || '0').toFixed(2)}` : 'Claimed'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Wallet Info */}
          <GlassCard className="bg-gradient-to-br from-[#6C5CE7]/10 to-[#00F5D4]/10">
            <h3 className="font-semibold mb-4">Wallet Info</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Connected Address</p>
                <p className="font-mono text-sm break-all">{formatAddress(address!)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">USDT Balance</p>
                <p className="text-xl font-semibold">
                  {parseFloat(stats.usdtBalance).toLocaleString()} USDT
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Vesting Schedule */}
          <GlassCard>
            <h3 className="font-semibold mb-4">Claim Milestones</h3>
            <div className="space-y-3">
              {[
                {
                  label: 'Purchased Tokens',
                  detail: `${totalTokens.toLocaleString()} WLG recorded`,
                  status: totalTokens > 0 ? 'claimed' : 'locked',
                },
                {
                  label: 'Claim Transaction',
                  detail: stats.userClaimed ? 'On-chain claim completed' : 'Waiting for claim',
                  status: stats.userClaimed ? 'claimed' : 'upcoming',
                },
              ].map((vest, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                >
                  <div>
                    <p className="text-sm font-semibold">{vest.label}</p>
                    <p className="text-xs text-gray-400">{vest.detail}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      vest.status === 'claimed'
                        ? 'bg-green-500/20 text-green-400'
                        : vest.status === 'upcoming'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {vest.status}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Important Notice */}
          <GlassCard className="bg-gradient-to-r from-blue-900/20 to-purple-900/20">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
              <div className="text-sm">
                <h3 className="font-semibold mb-2 text-blue-300">Vesting Info</h3>
                <p className="text-gray-300">
                  Claiming is now driven by live contract state, not mock vesting timelines.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

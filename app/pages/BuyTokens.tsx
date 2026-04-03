import { useState } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { GlassCard } from '../components/GlassCard';
import { useIdoContract } from '../hooks/useContract';
import { isContractsConfigured } from '../config/contracts';
import { DollarSign, ArrowRight, AlertCircle, CheckCircle, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';

export const BuyTokens = () => {
  const { address, isConnected } = useAccount();
  const { connectors, connectAsync, isPending: isConnectingWallet } = useConnect();
  const { stats, approveUsdt, buyTokens, simulateBuy } = useIdoContract();
  const [usdtAmount, setUsdtAmount] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [txHash, setTxHash] = useState('');

  const simulation = usdtAmount ? simulateBuy(usdtAmount) : null;
  const walletConnected = isConnected;
  const canUseContracts = walletConnected && isContractsConfigured;
  const blockReason = !walletConnected
    ? 'Connect wallet first'
    : !isContractsConfigured
      ? 'Configure contract addresses'
      : '';
  const needsApproval = parseFloat(usdtAmount || '0') > parseFloat(stats.usdtAllowance);
  const currentTier = Number(stats.currentTier || 0);
  const totalRaised = Number(stats.totalUsdtCollected || 0);
  const usdtPerTier = 2_000_000;
  const currentTierProgress = Math.min(((totalRaised % usdtPerTier) / usdtPerTier) * 100, 100);
  const tierRows = [0, 1, 2].map((offset) => {
    const tier = currentTier + offset;
    const price = 0.05 + (0.02 * tier);
    const progress = offset === 0 ? currentTierProgress : 0;
    return { tier, price, progress };
  });

  const handleQuickConnect = async () => {
    const readyConnectors = connectors.filter((connector) => connector.ready ?? true);
    if (readyConnectors.length === 0) {
      toast.error('No wallet connector available.');
      return;
    }

    const preferredConnector =
      readyConnectors.find((connector) => {
        const normalized = `${connector.id} ${connector.name}`.toLowerCase();
        return normalized.includes('meta');
      }) ?? readyConnectors[0];

    try {
      await connectAsync({ connector: preferredConnector });
      toast.success('Wallet connected successfully!');
    } catch (error) {
      console.error('Connect wallet failed:', error);
      toast.error('Failed to connect wallet.');
    }
  };

  const handleApprove = async () => {
    if (!usdtAmount || !canUseContracts) return;

    setIsApproving(true);
    try {
      const hash = await approveUsdt(usdtAmount);
      toast.success('USDT approval successful!');
      console.log('Approval TX:', hash);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Approval failed. Please try again.';
      toast.error(message);
      console.error('Approval error:', error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleBuy = async () => {
    if (!usdtAmount || !canUseContracts) return;

    setIsBuying(true);
    try {
      const hash = await buyTokens(usdtAmount);
      setTxHash(hash as string);
      toast.success('Purchase successful!');
      setUsdtAmount('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Purchase failed. Please try again.';
      toast.error(message);
      console.error('Buy error:', error);
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          <span className="bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] bg-clip-text text-transparent">
            Support via IDO
          </span>
        </h1>
        <p className="text-gray-400">Participate in the IDO while helping fund the wearelegend charity mission</p>
      </div>

      <div className="mb-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
        A dedicated share of platform revenue is routed to community aid, youth programs, and livelihood initiatives.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Buy Card */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard glow>
            <h2 className="text-2xl font-semibold mb-6">Purchase Tokens</h2>

            {/* Wallet Connection Warning */}
            {!walletConnected && (
              <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-200">
                    <p className="font-semibold mb-1">Wallet Not Connected</p>
                    <p>Please connect your wallet to participate in the IDO</p>
                    <button
                      onClick={handleQuickConnect}
                      disabled={isConnectingWallet}
                      className="mt-3 px-3 py-2 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-100 transition-all disabled:opacity-50"
                    >
                      {isConnectingWallet ? 'Connecting...' : 'Connect Wallet'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {walletConnected && !isContractsConfigured && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-200">
                    <p className="font-semibold mb-1">Contract Not Configured</p>
                    <p>Set VITE_IDO_CONTRACT_ADDRESS and VITE_USDT_CONTRACT_ADDRESS in your env.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Input Section */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Amount (USDT)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={usdtAmount}
                    onChange={(e) => setUsdtAmount(e.target.value)}
                    placeholder="Enter USDT amount"
                    disabled={!canUseContracts}
                    className="w-full px-4 py-3 pl-12 rounded-xl bg-white/5 border border-white/10 focus:border-[#6C5CE7] outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                {walletConnected && isContractsConfigured && (
                  <p className="text-sm text-gray-400 mt-1">
                    Balance: {parseFloat(stats.usdtBalance).toLocaleString()} USDT
                  </p>
                )}
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex gap-2">
                {['100', '500', '1000', '5000'].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setUsdtAmount(amount)}
                    disabled={!canUseContracts}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#6C5CE7]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    ${amount}
                  </button>
                ))}
              </div>

              {/* Simulation Results */}
              {simulation && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-[#6C5CE7]/10 to-[#00F5D4]/10 border border-[#6C5CE7]/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">You will receive:</span>
                    <span className="text-2xl font-bold text-[#00F5D4]">
                      {simulation.tokensReceived} WLG
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Price per token:</span>
                    <span className="text-white">${simulation.pricePerToken}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {needsApproval && canUseContracts && usdtAmount && (
                  <button
                    onClick={handleApprove}
                    disabled={isApproving || !usdtAmount}
                    className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isApproving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Approving USDT...
                      </>
                    ) : (
                      <>
                        <Shield className="w-5 h-5" />
                        Approve USDT
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={handleBuy}
                  disabled={!canUseContracts || !usdtAmount || isBuying || needsApproval}
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] hover:shadow-[0_0_40px_rgba(108,92,231,0.6)] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  title={blockReason || (needsApproval ? 'Approve USDT first' : undefined)}
                >
                  {isBuying ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {needsApproval ? 'Approve First' : 'Buy Tokens'}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>

              {/* Transaction Hash */}
              {txHash && (
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                  <div className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-green-400 font-semibold mb-1">Transaction Successful!</p>
                      <p className="text-gray-400 break-all">TX: {txHash}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Security Notice */}
          <GlassCard className="bg-gradient-to-r from-purple-900/20 to-blue-900/20">
            <div className="flex gap-3">
              <Shield className="w-6 h-6 text-[#00F5D4] flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Security Information</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• All transactions are processed through audited smart contracts</li>
                  <li>• Your wallet must approve each transaction</li>
                  <li>• Never share your private keys or seed phrase</li>
                  <li>• Verify contract addresses before approving</li>
                </ul>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Stats */}
          <GlassCard>
            <h3 className="font-semibold mb-4">Current Sale Stats</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Current Price</p>
                <p className="text-2xl font-bold text-[#00F5D4]">${stats.currentPrice}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Current Tier</p>
                <p className="text-xl font-semibold">Tier {stats.currentTier}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Sold</p>
                <p className="text-xl font-semibold">
                  {parseFloat(stats.totalSold).toLocaleString()} WLG
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Raised</p>
                <p className="text-xl font-semibold">
                  ${parseFloat(stats.totalUsdtCollected).toLocaleString()}
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Your Holdings */}
          {isConnected && (
            <GlassCard className="bg-gradient-to-br from-[#6C5CE7]/10 to-[#00F5D4]/10">
              <h3 className="font-semibold mb-4">Your Holdings</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Purchased</p>
                  <p className="text-2xl font-bold text-[#00F5D4]">
                    {parseFloat(stats.userPurchased).toLocaleString()} WLG
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Value (at current price)</p>
                  <p className="text-xl font-semibold">
                    ${(parseFloat(stats.userPurchased) * parseFloat(stats.currentPrice)).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Claim Status</p>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      stats.userClaimed
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}
                  >
                    {stats.userClaimed ? 'Claimed' : 'Pending'}
                  </span>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Tier Progress */}
          <GlassCard>
            <h3 className="font-semibold mb-4">Tier Progress</h3>
            <div className="space-y-3">
              {tierRows.map((tier) => (
                <div key={tier.tier}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Tier {tier.tier}</span>
                    <span className="text-gray-400">${tier.price.toFixed(2)}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4]"
                      style={{ width: `${tier.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

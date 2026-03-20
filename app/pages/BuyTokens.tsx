import { useState } from 'react';
import { useAccount } from 'wagmi';
import { GlassCard } from '../components/GlassCard';
import { useIdoContract } from '../hooks/useContract';
import { DollarSign, ArrowRight, AlertCircle, CheckCircle, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';

export const BuyTokens = () => {
  const { address, isConnected } = useAccount();
  const { stats, approveUsdt, buyTokens, simulateBuy } = useIdoContract();
  const [usdtAmount, setUsdtAmount] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [txHash, setTxHash] = useState('');

  const simulation = usdtAmount ? simulateBuy(usdtAmount) : null;
  const needsApproval = parseFloat(usdtAmount || '0') > parseFloat(stats.usdtAllowance);

  const handleApprove = async () => {
    if (!usdtAmount || !isConnected) return;

    setIsApproving(true);
    try {
      const hash = await approveUsdt(usdtAmount);
      toast.success('USDT approval successful!');
      console.log('Approval TX:', hash);
    } catch (error) {
      toast.error('Approval failed. Please try again.');
      console.error('Approval error:', error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleBuy = async () => {
    if (!usdtAmount || !isConnected) return;

    setIsBuying(true);
    try {
      const hash = await buyTokens(usdtAmount);
      setTxHash(hash as string);
      toast.success('Purchase successful!');
      setUsdtAmount('');
    } catch (error) {
      toast.error('Purchase failed. Please try again.');
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
            Buy Tokens
          </span>
        </h1>
        <p className="text-gray-400">Participate in the IDO and secure your tokens</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Buy Card */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard glow>
            <h2 className="text-2xl font-semibold mb-6">Purchase Tokens</h2>

            {/* Wallet Connection Warning */}
            {!isConnected && (
              <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-200">
                    <p className="font-semibold mb-1">Wallet Not Connected</p>
                    <p>Please connect your wallet to participate in the IDO</p>
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
                    disabled={!isConnected}
                    className="w-full px-4 py-3 pl-12 rounded-xl bg-white/5 border border-white/10 focus:border-[#6C5CE7] outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                {isConnected && (
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
                    disabled={!isConnected}
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
                      {simulation.tokensReceived} WL
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
                {needsApproval && isConnected && usdtAmount && (
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
                  disabled={!isConnected || !usdtAmount || isBuying || (needsApproval && !isApproving)}
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] hover:shadow-[0_0_40px_rgba(108,92,231,0.6)] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isBuying ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Buy Tokens
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
                  {parseFloat(stats.totalSold).toLocaleString()} WL
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
                    {parseFloat(stats.userPurchased).toLocaleString()} WL
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
              {[
                { tier: 1, price: '$0.03', progress: 100 },
                { tier: 2, price: '$0.05', progress: 56 },
                { tier: 3, price: '$0.08', progress: 0 },
              ].map((tier) => (
                <div key={tier.tier}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Tier {tier.tier}</span>
                    <span className="text-gray-400">{tier.price}</span>
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

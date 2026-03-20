import { GlassCard } from '../components/GlassCard';
import { useIdoContract } from '../hooks/useContract';
import { TrendingUp, DollarSign, Package, Users, BarChart3, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const Dashboard = () => {
  const { stats } = useIdoContract();

  const parseNumeric = (value: string) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const toCompact = (value: number, maximumFractionDigits = 2) =>
    new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits,
    }).format(value);

  const totalUsdtCollected = parseNumeric(stats.totalUsdtCollected);
  const totalSold = parseNumeric(stats.totalSold);
  const usdtPerTier = parseNumeric(stats.usdtPerTier) || 2_000_000;
  const startPrice = parseNumeric(stats.startPrice) || 0.05;
  const priceIncrement = parseNumeric(stats.priceIncrement) || 0.02;
  const maxTokens = parseNumeric(stats.maxTokens) || 244_000_000;

  const salesData = (() => {
    let cumulativeSold = 0;

    return Array.from({ length: 5 }, (_, index) => {
      const tier = index;
      const tierStartUsdt = usdtPerTier * tier;
      const collectedInTier = Math.max(0, Math.min(usdtPerTier, totalUsdtCollected - tierStartUsdt));
      const tierPrice = startPrice + priceIncrement * tier;
      const soldInTier = tierPrice > 0 ? collectedInTier / tierPrice : 0;
      cumulativeSold += soldInTier;

      return {
        name: `Tier ${tier + 1}`,
        sold: cumulativeSold,
        raised: Math.min(totalUsdtCollected, usdtPerTier * (tier + 1)),
      };
    });
  })();

  const tier1Sold = startPrice > 0 ? Math.min(totalUsdtCollected, usdtPerTier) / startPrice : 0;
  const tier2Sold = startPrice + priceIncrement > 0
    ? Math.min(Math.max(totalUsdtCollected - usdtPerTier, 0), usdtPerTier) / (startPrice + priceIncrement)
    : 0;
  const tier3Sold = Math.max(totalSold - tier1Sold - tier2Sold, 0);
  const remainingTokens = Math.max(maxTokens - totalSold, 0);

  const tierData = [
    { name: 'Tier 1', value: Math.max(tier1Sold, 0), color: '#6C5CE7' },
    { name: 'Tier 2', value: Math.max(tier2Sold, 0), color: '#00F5D4' },
    { name: 'Tier 3+', value: Math.max(tier3Sold, 0), color: '#9B7EDE' },
    { name: 'Remaining', value: Math.max(remainingTokens, 0), color: '#1a1a2e' },
  ];

  const tierRows = Array.from({ length: 3 }, (_, index) => {
    const tier = index;
    const tierStartUsdt = usdtPerTier * tier;
    const tierPrice = startPrice + priceIncrement * tier;
    const tierCollected = Math.max(0, Math.min(usdtPerTier, totalUsdtCollected - tierStartUsdt));
    const tierAllocation = tierPrice > 0 ? usdtPerTier / tierPrice : 0;
    const soldOut = tierCollected >= usdtPerTier;
    const isCurrentTier = stats.currentTier === tier;
    const isActive = isCurrentTier && !soldOut;

    return {
      tier: `Tier ${tier + 1}`,
      price: `$${tierPrice.toFixed(2)}`,
      allocation: `${toCompact(tierAllocation)} tokens`,
      status: soldOut ? 'Sold Out' : isActive ? 'Active' : 'Upcoming',
    };
  });

  const statsCards = [
    {
      icon: DollarSign,
      label: 'Total Raised',
      value: `$${totalUsdtCollected.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      change: `${((totalUsdtCollected / usdtPerTier) * 100).toFixed(2)}% of tier cap`,
      positive: true,
    },
    {
      icon: Package,
      label: 'Tokens Sold',
      value: `${totalSold.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      change: `${((totalSold / maxTokens) * 100).toFixed(2)}% of max supply`,
      positive: true,
    },
    {
      icon: TrendingUp,
      label: 'Current Price',
      value: `$${stats.currentPrice}`,
      change: `Tier ${stats.currentTier + 1}`,
      positive: true,
    },
    {
      icon: Users,
      label: 'Participants',
      value: stats.totalParticipants.toLocaleString(),
      change: 'Wallets joined',
      positive: true,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          <span className="bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] bg-clip-text text-transparent">
            IDO Dashboard
          </span>
        </h1>
        <p className="text-gray-400">Real-time statistics and analytics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, index) => (
          <GlassCard key={index} className="hover:border-[#6C5CE7]/50 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold mb-1">{stat.value}</p>
                <p className={`text-sm ${stat.positive ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.change}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#6C5CE7]/20 to-[#00F5D4]/20">
                <stat.icon className="w-6 h-6 text-[#00F5D4]" />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Sales Chart */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-[#00F5D4]" />
            <h3 className="text-xl font-semibold">Sales Progress</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="colorSold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6C5CE7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6C5CE7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === 'sold') {
                    return [toCompact(value), 'Tokens Sold'];
                  }

                  return [`$${toCompact(value)}`, 'USDT Raised'];
                }}
                contentStyle={{
                  backgroundColor: '#0a0a0f',
                  border: '1px solid #6C5CE7',
                  borderRadius: '8px',
                }}
              />
              <Area
                type="monotone"
                dataKey="sold"
                stroke="#6C5CE7"
                fillOpacity={1}
                fill="url(#colorSold)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Tier Distribution */}
        <GlassCard>
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-[#00F5D4]" />
            <h3 className="text-xl font-semibold">Tier Distribution</h3>
          </div>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tierData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {tierData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a0a0f',
                    border: '1px solid #6C5CE7',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Tier Information */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-6">
          <Package className="w-5 h-5 text-[#00F5D4]" />
          <h3 className="text-xl font-semibold">Tier Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tierRows.map((tier, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl border ${
                tier.status === 'Active'
                  ? 'border-[#00F5D4] bg-[#00F5D4]/5'
                  : tier.status === 'Sold Out'
                  ? 'border-gray-600 bg-gray-600/5'
                  : 'border-[#6C5CE7]/30 bg-[#6C5CE7]/5'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{tier.tier}</h4>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    tier.status === 'Active'
                      ? 'bg-green-500/20 text-green-400'
                      : tier.status === 'Sold Out'
                      ? 'bg-gray-500/20 text-gray-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}
                >
                  {tier.status}
                </span>
              </div>
              <p className="text-2xl font-bold text-[#00F5D4] mb-1">{tier.price}</p>
              <p className="text-sm text-gray-400">{tier.allocation}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

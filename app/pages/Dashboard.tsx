import { GlassCard } from '../components/GlassCard';
import { useIdoContract } from '../hooks/useContract';
import { TrendingUp, DollarSign, Package, Users, BarChart3, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const Dashboard = () => {
  const { stats } = useIdoContract();

  const salesData = [
    { name: 'Week 1', sold: 400000, raised: 20000 },
    { name: 'Week 2', sold: 800000, raised: 40000 },
    { name: 'Week 3', sold: 1200000, raised: 60000 },
    { name: 'Week 4', sold: 1800000, raised: 90000 },
    { name: 'Week 5', sold: 2450000, raised: 122500 },
  ];

  const tierData = [
    { name: 'Tier 1', value: 1000000, color: '#6C5CE7' },
    { name: 'Tier 2', value: 850000, color: '#00F5D4' },
    { name: 'Tier 3', value: 600000, color: '#9B7EDE' },
    { name: 'Remaining', value: 2550000, color: '#1a1a2e' },
  ];

  const statsCards = [
    {
      icon: DollarSign,
      label: 'Total Raised',
      value: `$${parseFloat(stats.totalUsdtCollected).toLocaleString()}`,
      change: '+12.5%',
      positive: true,
    },
    {
      icon: Package,
      label: 'Tokens Sold',
      value: `${parseFloat(stats.totalSold).toLocaleString()}`,
      change: '+8.3%',
      positive: true,
    },
    {
      icon: TrendingUp,
      label: 'Current Price',
      value: `$${stats.currentPrice}`,
      change: 'Tier 2',
      positive: true,
    },
    {
      icon: Users,
      label: 'Participants',
      value: '1,247',
      change: '+156 today',
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
          {[
            { tier: 'Tier 1', price: '$0.03', allocation: '1M tokens', status: 'Sold Out' },
            { tier: 'Tier 2', price: '$0.05', allocation: '1.5M tokens', status: 'Active' },
            { tier: 'Tier 3', price: '$0.08', allocation: '2M tokens', status: 'Upcoming' },
          ].map((tier, index) => (
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

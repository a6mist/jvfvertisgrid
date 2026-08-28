import { motion } from 'motion/react';
import { colors } from '../config/design-tokens';
import { Link } from 'react-router';
import { TrendingUp, Wallet, Settings, Eye } from 'lucide-react';

export const LaunchApp = () => {
  const menuItems = [
    { icon: TrendingUp, label: 'Dashboard', active: true },
    { icon: Eye, label: 'Markets' },
    { icon: Wallet, label: 'Portfolio' },
    { icon: Settings, label: 'Settings' },
  ];

  const kpis = [
    { label: 'Portfolio Value', value: '$0.00', change: '+0.00%' },
    { label: '24H P&L', value: '+$0.00', change: 'Live' },
    { label: 'Open Orders', value: '0', change: '—' },
    { label: 'Available Balance', value: '$0.00', change: 'USDT' },
  ];

  const watchlist = [
    { sym: 'BTC', name: 'Bitcoin', price: '$68,420.15', change: '+3.27%' },
    { sym: 'ETH', name: 'Ethereum', price: '$3,184.62', change: '+2.84%' },
    { sym: 'SOL', name: 'Solana', price: '$171.08', change: '+5.42%' },
    { sym: 'AVAX', name: 'Avalanche', price: '$41.37', change: '-1.23%' },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: colors.bg, color: colors.text }}>
      {/* Background Grid */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 90%)',
        }}
      />

      {/* Header */}
      <header
        className="sticky top-0 z-50 backdrop-blur-md border-b"
        style={{
          background: 'rgba(10, 14, 20, 0.85)',
          borderColor: colors.borderSoft,
        }}
      >
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold">
            JVF
          </Link>
          <div className="text-xs tracking-wider" style={{ color: colors.teal }}>
            LIVE · DEMO MODE
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex z-10">
        {/* Sidebar */}
        <div
          className="w-48 border-r p-6"
          style={{ background: colors.bgAlt, borderColor: colors.borderSoft }}
        >
          <nav className="flex flex-col gap-2">
            {menuItems.map((item) => (
              <button
                key={item.label}
                className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium"
                style={{
                  background: item.active ? colors.surface2 : 'transparent',
                  color: item.active ? colors.text : colors.textDim,
                }}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {kpis.map((kpi, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl border"
                  style={{ background: colors.surface, borderColor: colors.border }}
                >
                  <div className="text-xs tracking-wider mb-2" style={{ color: colors.textFaint }}>
                    {kpi.label}
                  </div>
                  <div className="text-2xl font-bold mb-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {kpi.value}
                  </div>
                  <div className="text-xs" style={{ color: colors.textDim }}>
                    {kpi.change}
                  </div>
                </div>
              ))}
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Watchlist */}
              <div
                className="lg:col-span-2 p-6 rounded-2xl border"
                style={{ background: colors.surface, borderColor: colors.border }}
              >
                <h2 className="text-xl font-semibold mb-6">Watchlist</h2>
                <div className="space-y-3">
                  {watchlist.map((asset, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 rounded-lg transition-all hover:bg-opacity-50"
                      style={{ background: colors.bg }}
                    >
                      <div>
                        <div className="font-medium">{asset.sym}</div>
                        <div className="text-xs" style={{ color: colors.textFaint }}>
                          {asset.name}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{asset.price}</div>
                        <div
                          className="text-xs"
                          style={{
                            color: asset.change.startsWith('+') ? colors.green : colors.red,
                          }}
                        >
                          {asset.change}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Order */}
              <div
                className="p-6 rounded-2xl border"
                style={{ background: colors.surface, borderColor: colors.border }}
              >
                <h2 className="text-xl font-semibold mb-6">Quick order</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs tracking-wider block mb-2" style={{ color: colors.textFaint }}>
                      ASSET
                    </label>
                    <div
                      className="px-3 py-2.5 rounded-lg border text-sm"
                      style={{ background: colors.bg, borderColor: colors.border, color: colors.textDim }}
                    >
                      BTC/USD
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{
                        background: colors.green + '22',
                        color: colors.green,
                      }}
                    >
                      Buy
                    </button>
                    <button
                      className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                      style={{
                        background: colors.border,
                        color: colors.textDim,
                      }}
                    >
                      Sell
                    </button>
                  </div>

                  <div>
                    <label className="text-xs tracking-wider block mb-2" style={{ color: colors.textFaint }}>
                      AMOUNT
                    </label>
                    <input
                      type="text"
                      placeholder="0.00"
                      disabled
                      className="w-full px-3 py-2.5 rounded-lg border text-sm"
                      style={{
                        background: colors.bg,
                        borderColor: colors.border,
                        color: colors.textDim,
                        opacity: 0.5,
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-xs tracking-wider block mb-2" style={{ color: colors.textFaint }}>
                      PRICE
                    </label>
                    <div
                      className="px-3 py-2.5 rounded-lg border text-sm"
                      style={{
                        background: colors.bg,
                        borderColor: colors.border,
                        color: colors.textDim,
                      }}
                    >
                      $68,420.15
                    </div>
                  </div>

                  <button
                    disabled
                    className="w-full py-3 rounded-lg font-semibold text-black transition-all"
                    style={{
                      background: `linear-gradient(135deg, ${colors.blue}, ${colors.teal})`,
                      opacity: 0.6,
                    }}
                  >
                    Sign in to place order
                  </button>

                  <p className="text-xs text-center" style={{ color: colors.textFaint }}>
                    This is a preview. Sign in to trade live.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

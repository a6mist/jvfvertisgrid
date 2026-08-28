import { Link } from 'react-router';
import { motion } from 'motion/react';
import { colors } from '../config/design-tokens';
import { useState } from 'react';

export const Markets = () => {
  const [activeFilter, setActiveFilter] = useState('all');

  const assets = [
    { sym: 'BTC', name: 'Bitcoin', price: 68420.15, change24h: 3.27, volume: '$42.5B', chart: [10, 12, 11, 14, 13, 16, 18, 17, 20, 19, 22] },
    { sym: 'ETH', name: 'Ethereum', price: 3184.62, change24h: 2.84, volume: '$18.3B', chart: [14, 13, 15, 14, 16, 15, 17, 19, 18, 20, 19] },
    { sym: 'SOL', name: 'Solana', price: 171.08, change24h: 5.42, volume: '$8.2B', chart: [8, 10, 9, 12, 11, 10, 13, 15, 14, 17, 18] },
    { sym: 'AVAX', name: 'Avalanche', price: 41.37, change24h: -1.23, volume: '$2.1B', chart: [16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6] },
    { sym: 'LINK', name: 'Chainlink', price: 16.92, change24h: 1.87, volume: '$1.8B', chart: [9, 9, 10, 11, 10, 12, 13, 12, 14, 15, 16] },
    { sym: 'DOT', name: 'Polkadot', price: 7.44, change24h: -2.15, volume: '$1.5B', chart: [12, 11, 10, 9, 10, 9, 8, 7, 7, 6, 5] },
    { sym: 'ADA', name: 'Cardano', price: 0.98, change24h: 0.34, volume: '$0.8B', chart: [11, 10, 11, 10, 11, 10, 11, 12, 11, 12, 13] },
    { sym: 'MATIC', name: 'Polygon', price: 0.52, change24h: 4.12, volume: '$0.9B', chart: [7, 8, 7, 9, 8, 10, 9, 11, 10, 12, 14] },
    { sym: 'XRP', name: 'Ripple', price: 2.45, change24h: -0.54, volume: '$1.3B', chart: [13, 12, 13, 12, 13, 12, 13, 12, 13, 12, 13] },
  ];

  const stats = [
    { label: '24H Volume', value: '$76.4B' },
    { label: 'Assets Listed', value: '140+' },
    { label: 'Avg Match Time', value: '12ms' },
    { label: '24/7 Settlement', value: 'Live' },
  ];

  return (
    <div className="min-h-screen" style={{ background: colors.bg, color: colors.text }}>
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

      {/* Hero */}
      <section className="relative pt-24 pb-16 px-8 z-10" style={{ paddingTop: '88px', paddingBottom: '64px' }}>
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-6 text-sm" style={{ color: colors.textFaint }}>
              JVF / <span style={{ color: colors.text }}>Markets</span>
            </div>
            <h1
              className="text-5xl lg:text-6xl font-bold mb-4"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              Every market. One tape.
            </h1>
            <p className="text-lg max-w-2xl" style={{ color: colors.textDim }}>
              Full order-book depth, real-time pricing, and 24H volume across every asset listed on JVF — sourced directly from liquidity venues, never delayed or synthetic.
            </p>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
              {stats.map((stat, i) => (
                <div key={i}>
                  <div className="text-xs tracking-wider mb-2" style={{ color: colors.textFaint }}>
                    {stat.label}
                  </div>
                  <div className="text-2xl font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Markets Table Section */}
      <section className="py-16 px-8 z-10 relative">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
              <div>
                <h2
                  className="text-4xl font-bold mb-2"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  What's moving right now
                </h2>
              </div>
              <div className="flex gap-2 flex-wrap">
                {['all', 'gainers', 'losers', 'volume'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className="px-3.5 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{
                      border: `1px solid ${colors.border}`,
                      background: activeFilter === filter ? colors.surface2 : 'transparent',
                      color: activeFilter === filter ? colors.text : colors.textDim,
                      borderColor: activeFilter === filter ? '#2A3846' : colors.border,
                    }}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Markets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {assets.map((asset, i) => {
                const isUp = asset.change24h >= 0;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                    viewport={{ once: true }}
                    className="p-5.5 rounded-3.5 border hover:border-opacity-100 transition-all"
                    style={{
                      background: colors.surface,
                      borderColor: colors.border,
                    }}
                  >
                    <div className="flex justify-between items-start mb-4.5">
                      <div>
                        <div className="font-semibold text-lg">{asset.sym}</div>
                        <div className="text-xs" style={{ color: colors.textFaint }}>
                          {asset.name}
                        </div>
                      </div>
                      <div
                        className="px-2 py-1 rounded text-xs font-semibold"
                        style={{
                          background: isUp ? 'rgba(46, 213, 115, 0.12)' : 'rgba(255, 92, 122, 0.12)',
                          color: isUp ? colors.green : colors.red,
                        }}
                      >
                        {isUp ? '▲' : '▼'} {Math.abs(asset.change24h).toFixed(2)}%
                      </div>
                    </div>

                    <div className="mb-3.5">
                      <div className="text-2xl font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs mt-1" style={{ color: colors.textFaint }}>
                        Vol: {asset.volume}
                      </div>
                    </div>

                    {/* Volume Bar */}
                    <div
                      className="h-1 rounded overflow-hidden"
                      style={{ background: colors.border }}
                    >
                      <div
                        className="h-full"
                        style={{
                          background: `linear-gradient(135deg, ${colors.blue}, ${colors.teal})`,
                          width: `${Math.random() * 100}%`,
                        }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-8 z-10 relative">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="p-16 rounded-3xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 border"
            style={{
              background: `radial-gradient(ellipse 90% 140% at 30% 0%, rgba(47, 211, 232, 0.14), transparent 60%), linear-gradient(160deg, #0D2438, #0A1420)`,
              borderColor: colors.border,
            }}
          >
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-2.5" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Trade any of it instantly
              </h2>
              <p style={{ color: colors.textDim }}>
                Sub-second execution, transparent spreads, and audited custody on every listed asset
              </p>
            </div>
            <Link
              to="/launch-app"
              className="px-6 py-3.5 rounded-2xl font-semibold text-black text-nowrap flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${colors.blue}, ${colors.teal})` }}
            >
              Launch App
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

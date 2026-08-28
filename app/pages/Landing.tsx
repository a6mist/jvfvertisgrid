import { Link } from 'react-router';
import { motion } from 'motion/react';
import { colors } from '../config/design-tokens';
import { BarChart3, Shield, Zap } from 'lucide-react';

export const Landing = () => {
  const assets = [
    { sym: 'BTC', name: 'Bitcoin', price: 68420.15, spark: [10, 12, 11, 14, 13, 16, 18, 17, 20, 19, 22], color: '#F7931A' },
    { sym: 'ETH', name: 'Ethereum', price: 3184.62, spark: [14, 13, 15, 14, 16, 15, 17, 19, 18, 20, 19], color: '#8C8FFF' },
    { sym: 'SOL', name: 'Solana', price: 171.08, spark: [8, 10, 9, 12, 11, 10, 13, 15, 14, 17, 18], color: '#2FD3E8' },
    { sym: 'AVAX', name: 'Avalanche', price: 41.37, spark: [16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6], color: '#FF5C7A' },
  ];

  const features = [
    {
      icon: BarChart3,
      title: 'Direct market data',
      description: 'Order books and price feeds sourced straight from liquidity venues — no delayed or synthetic pricing.',
    },
    {
      icon: Shield,
      title: 'Custody you can verify',
      description: 'Assets held in audited cold storage with proof-of-reserves published on a running basis.',
    },
    {
      icon: Zap,
      title: 'Sub-second execution',
      description: 'Matching engine built for speed — orders route and settle in milliseconds, not minutes.',
    },
  ];

  const trustStats = [
    { num: '$2.4B+', lbl: 'VOLUME PROCESSED' },
    { num: '140+', lbl: 'ASSETS LISTED' },
    { num: '99.98%', lbl: 'UPTIME (12MO)' },
    { num: '24/7', lbl: 'SETTLEMENT' },
  ];

  const pctChange = (points: number[]) => {
    const raw = ((points[points.length - 1] - points[0]) / points[0]) * 100;
    return raw * 0.18;
  };

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

      {/* Hero Section */}
      <section className="relative pt-22 pb-16 px-8 overflow-hidden z-10" style={{ paddingTop: '88px', paddingBottom: '64px' }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Eyebrow */}
              <div
                className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider mb-6 px-3 py-1.5 rounded-full border"
                style={{
                  color: colors.teal,
                  background: `rgba(47, 211, 232, 0.08)`,
                  borderColor: `rgba(47, 211, 232, 0.25)`,
                }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: colors.green }}
                />
                LIVE MARKETS · 140+ ASSETS
              </div>

              {/* Heading */}
              <h1
                className="text-5xl lg:text-6xl font-bold leading-tight mb-6"
                style={{ fontFamily: 'Space Grotesk, sans-serif' }}
              >
                Trade the grid.
                <br />
                <span
                  style={{
                    background: `linear-gradient(135deg, ${colors.blue}, ${colors.teal})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Not the noise.
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-lg mb-8" style={{ color: colors.textDim, maxWidth: '460px' }}>
                JVF is a crypto financial platform built on transparent pricing and real-time execution — no gimmicks, no hidden spreads, just the market as it actually moves.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3.5 mb-10">
                <Link
                  to="/launch-app"
                  className="px-6 py-3.5 rounded-2xl font-semibold text-black text-center"
                  style={{ background: `linear-gradient(135deg, ${colors.blue}, ${colors.teal})` }}
                >
                  Launch App →
                </Link>
                <Link
                  to="/markets"
                  className="px-6 py-3.5 rounded-2xl font-semibold text-center border transition-all hover:border-opacity-100"
                  style={{ borderColor: colors.border, color: colors.text }}
                >
                  View Markets
                </Link>
              </div>

              {/* Trust Stats */}
              <div className="flex flex-wrap gap-7">
                {trustStats.map((stat, i) => (
                  <div key={i}>
                    <div
                      className="text-lg font-bold"
                      style={{ fontFamily: 'JetBrains Mono, monospace' }}
                    >
                      {stat.num}
                    </div>
                    <div className="text-xs tracking-tight" style={{ color: colors.textFaint }}>
                      {stat.lbl}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Asset Cards */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col gap-3"
            >
              {assets.map((asset, i) => {
                const up = asset.spark[asset.spark.length - 1] >= asset.spark[0];
                const pct = pctChange(asset.spark).toFixed(2);
                return (
                  <div
                    key={i}
                    className="p-4 rounded-3xl flex items-center justify-between gap-3.5 border transition-all hover:border-opacity-100"
                    style={{
                      background: `linear-gradient(180deg, ${colors.surface}, ${colors.bgAlt})`,
                      borderColor: colors.border,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9.5 h-9.5 rounded-2.5 flex items-center justify-center text-sm font-bold"
                        style={{ background: `${asset.color}22`, color: asset.color }}
                      >
                        {asset.sym.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{asset.sym}</div>
                        <div className="text-xs" style={{ color: colors.textFaint }}>
                          {asset.name}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3.5">
                      <div className="text-right min-w-[82px]">
                        <div className="text-sm font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div
                          className="text-xs font-semibold flex items-center justify-end gap-1"
                          style={{ color: up ? colors.green : colors.red }}
                        >
                          {up ? '▲' : '▼'} {Math.abs(Number(pct))}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="text-xs mt-3.5" style={{ color: colors.textFaint }}>
                <span style={{ color: colors.green }}>●</span> Prices update in real time
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-8 z-10 relative" style={{ background: colors.bg }}>
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider mb-4 px-3 py-1.5 rounded-full border" style={{ color: colors.teal, borderColor: `rgba(47, 211, 232, 0.25)` }}>
              PLATFORM
            </div>
            <h2
              className="text-4xl lg:text-5xl font-bold mb-4"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              Built for people who watch the tape.
            </h2>
            <p style={{ color: colors.textDim }}>
              Every part of JVF is designed around one idea: you should see exactly what the market sees, at the same moment it sees it.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px rounded-3xl overflow-hidden border" style={{ background: colors.borderSoft, borderColor: colors.borderSoft }}>
            {features.map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-8 lg:p-9"
                style={{ background: colors.bg }}
              >
                <div
                  className="w-10 h-10 rounded-2.5 flex items-center justify-center mb-5 border"
                  style={{ background: colors.surface2, borderColor: colors.border }}
                >
                  <feat.icon size={20} style={{ color: colors.teal }} />
                </div>
                <h3 className="text-lg font-semibold mb-2.5" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {feat.title}
                </h3>
                <p className="text-sm" style={{ color: colors.textDim }}>
                  {feat.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-24 px-8 z-10 relative" style={{ background: colors.bgAlt, borderTop: `1px solid ${colors.borderSoft}`, borderBottom: `1px solid ${colors.borderSoft}` }}>
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider mb-4 px-3 py-1.5 rounded-full border" style={{ color: colors.teal, borderColor: `rgba(47, 211, 232, 0.25)` }}>
              SECURITY
            </div>
            <h2
              className="text-3xl lg:text-4xl font-bold"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              Nothing about your funds is a guessing game.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px rounded-3xl overflow-hidden border" style={{ background: colors.borderSoft, borderColor: colors.borderSoft }}>
            {[
              { title: 'Cold storage', desc: '95%+ of assets held offline in multi-sig vaults.' },
              { title: 'Independent audits', desc: 'Quarterly reserve and code audits from third parties.' },
              { title: '24/7 monitoring', desc: 'Real-time anomaly detection across every account.' },
              { title: 'Insured custody', desc: 'Digital asset insurance covering custodial holdings.' },
            ].map((item, i) => (
              <div key={i} className="p-6 flex flex-col gap-2.5" style={{ background: colors.bgAlt }}>
                <Shield size={24} style={{ color: colors.teal }} />
                <b className="font-semibold" style={{ color: colors.text }}>
                  {item.title}
                </b>
                <span className="text-xs" style={{ color: colors.textFaint }}>
                  {item.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
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
                Ready to see the market clearly?
              </h2>
              <p style={{ color: colors.textDim }}>
                Create an account in minutes — no funding required to start watching the tape.
              </p>
            </div>
            <Link
              to="/signin"
              className="px-6 py-3.5 rounded-2xl font-semibold text-black text-nowrap flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${colors.blue}, ${colors.teal})` }}
            >
              Create free account
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

import { Link } from 'react-router';
import { motion } from 'motion/react';
import { colors } from '../config/design-tokens';
import { BarChart3, Shield, Zap, Code2, DollarSign, Clock } from 'lucide-react';

export const Platform = () => {
  const features = [
    {
      icon: BarChart3,
      title: 'Direct market data',
      description: 'Order books and price feeds sourced straight from liquidity venues',
    },
    {
      icon: Shield,
      title: 'Custody you can verify',
      description: 'Assets held in audited cold storage with proof-of-reserves',
    },
    {
      icon: Zap,
      title: 'Sub-second execution',
      description: 'Matching engine built for speed — orders settle in milliseconds',
    },
    {
      icon: Code2,
      title: 'Programmatic access',
      description: 'REST API and WebSocket feeds for seamless integration',
    },
    {
      icon: DollarSign,
      title: 'Transparent spreads',
      description: 'No hidden fees, no synthetic pricing — exactly what you see',
    },
    {
      icon: Clock,
      title: '24/7 settlement',
      description: 'Trade and settle anytime, no market hours restrictions',
    },
  ];

  const steps = [
    {
      num: '1',
      title: 'Create an account',
      description: 'Sign up in minutes with email. No funding required.',
    },
    {
      num: '2',
      title: 'Fund your wallet',
      description: 'Deposit fiat or crypto from your preferred venue.',
    },
    {
      num: '3',
      title: 'Trade the tape',
      description: 'Execute orders with live market data at your fingertips.',
    },
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
      <section className="relative pt-24 pb-16 px-8 z-10" style={{ paddingTop: '88px' }}>
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-6 text-sm" style={{ color: colors.textFaint }}>
              JVF / <span style={{ color: colors.text }}>Platform</span>
            </div>
            <h1
              className="text-5xl lg:text-6xl font-bold mb-4"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              Built for people who watch the tape.
            </h1>
            <p className="text-lg max-w-2xl" style={{ color: colors.textDim }}>
              Every part of JVF is designed around one idea: you should see exactly what the market sees, at the same moment it sees it — then act on it without friction.
            </p>

            <div className="flex flex-col sm:flex-row gap-3.5 mt-8">
              <Link
                to="/launch-app"
                className="px-6 py-3.5 rounded-2xl font-semibold text-black text-center"
                style={{ background: `linear-gradient(135deg, ${colors.blue}, ${colors.teal})` }}
              >
                Launch App →
              </Link>
              <Link
                to="/docs"
                className="px-6 py-3.5 rounded-2xl font-semibold text-center border transition-all"
                style={{ borderColor: colors.border, color: colors.text }}
              >
                Read the docs
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-8 z-10 relative">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px rounded-3xl overflow-hidden border" style={{ background: colors.borderSoft, borderColor: colors.borderSoft }}>
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

      {/* How It Works */}
      <section className="py-24 px-8 z-10 relative" style={{ background: colors.bgAlt, borderTop: `1px solid ${colors.borderSoft}`, borderBottom: `1px solid ${colors.borderSoft}` }}>
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2
              className="text-4xl font-bold mb-4"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              How it works
            </h2>
            <p style={{ color: colors.textDim }}>
              Get started in three simple steps
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg mb-4"
                  style={{ background: colors.surface2, color: colors.teal }}
                >
                  {step.num}
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {step.title}
                </h3>
                <p style={{ color: colors.textDim }}>
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
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
                See the platform in motion
              </h2>
              <p style={{ color: colors.textDim }}>
                No account required to explore the dashboard and watch live markets.
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

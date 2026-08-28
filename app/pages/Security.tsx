import { Link } from 'react-router';
import { motion } from 'motion/react';
import { colors } from '../config/design-tokens';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';

export const Security = () => {
  const pillars = [
    { title: 'Cold storage', desc: '95%+ of assets held offline in multi-sig vaults.' },
    { title: 'Independent audits', desc: 'Quarterly reserve and code audits from third parties.' },
    { title: '24/7 monitoring', desc: 'Real-time anomaly detection across every account.' },
    { title: 'Insured custody', desc: 'Digital asset insurance covering custodial holdings.' },
  ];

  const reserves = [
    { asset: 'BTC', ratio: '102.1%', date: 'Aug 2026' },
    { asset: 'ETH', ratio: '101.4%', date: 'Aug 2026' },
    { asset: 'USDC', ratio: '100.8%', date: 'Aug 2026' },
    { asset: 'SOL', ratio: '103.6%', date: 'Aug 2026' },
  ];

  const protections = [
    {
      title: 'Two-factor authentication',
      desc: 'TOTP or security keys for every account',
      icon: CheckCircle,
    },
    {
      title: 'Withdrawal allowlisting',
      desc: 'Restrict withdrawals to pre-approved addresses',
      icon: CheckCircle,
    },
    {
      title: 'Session and device alerts',
      desc: 'Receive instant notifications of account activity',
      icon: CheckCircle,
    },
    {
      title: 'Anomaly detection',
      desc: 'AI-powered detection of suspicious behavior',
      icon: AlertCircle,
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
              JVF / <span style={{ color: colors.text }}>Security</span>
            </div>
            <h1
              className="text-5xl lg:text-6xl font-bold mb-4"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              Nothing about your funds is a guessing game.
            </h1>
            <p className="text-lg max-w-2xl" style={{ color: colors.textDim }}>
              Custody, audits, and monitoring are built to be checked, not just trusted. Here's exactly how JVF protects what you hold with us.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Security Pillars */}
      <section className="py-24 px-8 z-10 relative">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px rounded-3xl overflow-hidden border" style={{ background: colors.borderSoft, borderColor: colors.borderSoft }}>
            {pillars.map((pillar, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-6 flex flex-col gap-2.5"
                style={{ background: colors.bgAlt }}
              >
                <Shield size={24} style={{ color: colors.teal }} />
                <b className="font-semibold" style={{ color: colors.text }}>
                  {pillar.title}
                </b>
                <span className="text-xs" style={{ color: colors.textFaint }}>
                  {pillar.desc}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Proof of Reserves */}
      <section className="py-24 px-8 z-10 relative" style={{ background: colors.bgAlt, borderTop: `1px solid ${colors.borderSoft}`, borderBottom: `1px solid ${colors.borderSoft}` }}>
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2
              className="text-4xl font-bold mb-4"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              Proof of reserves
            </h2>
            <p style={{ color: colors.textDim }}>
              We publish reserve ratios quarterly. All ratios above 100% mean customers own 100% of their assets.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {reserves.map((reserve, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-3xl border"
                style={{ background: colors.bg, borderColor: colors.border }}
              >
                <div className="text-sm" style={{ color: colors.textFaint }}>
                  {reserve.asset} Reserves
                </div>
                <div className="text-3xl font-bold mt-2" style={{ fontFamily: 'JetBrains Mono, monospace', color: colors.green }}>
                  {reserve.ratio}
                </div>
                <div className="text-xs mt-3" style={{ color: colors.textFaint }}>
                  Updated {reserve.date}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Account Protection */}
      <section className="py-24 px-8 z-10 relative">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2
              className="text-4xl font-bold mb-4"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              Account protection
            </h2>
            <p style={{ color: colors.textDim }}>
              Multi-layer defense at account level
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {protections.map((prot, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-8 rounded-3xl border"
                style={{ background: colors.surface, borderColor: colors.border }}
              >
                <div className="flex items-start gap-4">
                  <prot.icon size={24} style={{ color: colors.teal, flexShrink: 0 }} />
                  <div>
                    <h3 className="font-semibold mb-1">{prot.title}</h3>
                    <p className="text-sm" style={{ color: colors.textDim }}>
                      {prot.desc}
                    </p>
                  </div>
                </div>
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
                Questions about our security posture?
              </h2>
              <p style={{ color: colors.textDim }}>
                Our security documentation and audit reports are public.
              </p>
            </div>
            <Link
              to="/docs"
              className="px-6 py-3.5 rounded-2xl font-semibold text-black text-nowrap flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${colors.blue}, ${colors.teal})` }}
            >
              Read the docs
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

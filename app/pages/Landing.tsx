import { Link } from 'react-router';
import { GlassCard } from '../components/GlassCard';
import { Rocket, Shield, Zap, TrendingUp, Users, Lock } from 'lucide-react';
import { motion } from 'motion/react';

export const Landing = () => {
  const features = [
    {
      icon: Shield,
      title: 'Transparent Giving',
      description: 'On-chain fundraising and allocation flows make charity impact auditable.',
    },
    {
      icon: Zap,
      title: 'Fast Participation',
      description: 'Support the mission through instant USDT participation and invoice payments.',
    },
    {
      icon: TrendingUp,
      title: 'Tiered IDO Model',
      description: 'Progressive pricing rewards early contributors while funding long-term impact.',
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Every participant helps fund community aid, youth programs, and livelihood support.',
    },
    {
      icon: Lock,
      title: 'Smart Contract Based',
      description: 'Contract-enforced rules protect treasury flow, invoice settlement, and claims.',
    },
    {
      icon: Rocket,
      title: 'Mission at Scale',
      description: 'A single platform for charity funding, token launch, and transparent reporting.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C5CE7]/20 via-transparent to-[#00F5D4]/20 blur-3xl" />
        
        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-[#6C5CE7] via-[#00F5D4] to-[#6C5CE7] bg-clip-text text-transparent">
                wearelegend Charity IDO
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
              A charity-first launchpad where every on-chain action helps fund real-world social impact.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/buy"
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] hover:shadow-[0_0_40px_rgba(108,92,231,0.6)] transition-all font-semibold text-lg"
              >
                Support Through IDO
              </Link>
              <Link
                to="/dashboard"
                className="px-8 py-4 rounded-xl border-2 border-[#6C5CE7]/50 hover:bg-[#6C5CE7]/10 transition-all font-semibold text-lg"
              >
                View Dashboard
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20"
          >
            <GlassCard glow>
              <div className="text-center">
                <p className="text-4xl font-bold bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] bg-clip-text text-transparent mb-2">
                  $122.5K
                </p>
                <p className="text-gray-400">Total Raised (USDT)</p>
              </div>
            </GlassCard>
            
            <GlassCard glow>
              <div className="text-center">
                <p className="text-4xl font-bold bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] bg-clip-text text-transparent mb-2">
                  2.45M
                </p>
                <p className="text-gray-400">Tokens Sold</p>
              </div>
            </GlassCard>
            
            <GlassCard glow>
              <div className="text-center">
                <p className="text-4xl font-bold bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] bg-clip-text text-transparent mb-2">
                  $0.05
                </p>
                <p className="text-gray-400">Current Price</p>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Why Build With <span className="bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] bg-clip-text text-transparent">wearelegend</span>?
            </h2>
            <p className="text-xl text-gray-400">Built for transparent fundraising, social impact, and sustainable token growth</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <GlassCard className="hover:border-[#6C5CE7]/50 transition-all h-full">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#6C5CE7]/20 to-[#00F5D4]/20 flex items-center justify-center mb-4">
                      <feature.icon className="w-8 h-8 text-[#00F5D4]" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-400">{feature.description}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <GlassCard glow className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Fund Impact?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Connect your wallet, join the IDO, and help scale our charity mission.
            </p>
            <Link
              to="/buy"
              className="inline-block px-8 py-4 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] hover:shadow-[0_0_40px_rgba(108,92,231,0.6)] transition-all font-semibold text-lg"
            >
              Get Started Now
            </Link>
          </GlassCard>
        </div>
      </section>
    </div>
  );
};

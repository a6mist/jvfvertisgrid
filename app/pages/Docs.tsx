import { Link } from 'react-router';
import { motion } from 'motion/react';
import { colors } from '../config/design-tokens';
import { Code2, Zap, Layers } from 'lucide-react';

export const Docs = () => {
  const quickstart = [
    {
      icon: Code2,
      title: 'Quickstart',
      desc: 'Get your API key and make your first authenticated request in 5 minutes',
    },
    {
      icon: Zap,
      title: 'Market data',
      desc: 'WebSocket streaming of tickers, trades, and order book updates',
    },
    {
      icon: Layers,
      title: 'Order management',
      desc: 'REST API for placing, canceling, and monitoring orders in real-time',
    },
  ];

  const endpoints = [
    { method: 'GET', path: '/v1/markets', desc: 'List all available markets' },
    { method: 'GET', path: '/v1/orderbook/{pair}', desc: 'Get full order book depth' },
    { method: 'POST', path: '/v1/orders', desc: 'Place a new order' },
    { method: 'DELETE', path: '/v1/orders/{id}', desc: 'Cancel an order' },
    { method: 'GET', path: '/v1/account/balances', desc: 'Get account balances' },
  ];

  const navItems = [
    'Getting started',
    'Authentication',
    'REST API',
    'WebSocket feed',
    'Rate limits',
    'Reference',
    'Support',
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
              JVF / <span style={{ color: colors.text }}>Docs</span>
            </div>
            <h1
              className="text-5xl lg:text-6xl font-bold mb-4"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              Build on JVF
            </h1>
            <p className="text-lg max-w-2xl" style={{ color: colors.textDim }}>
              The JVF API gives you programmatic access to live order books, historical data, and order management — the same infrastructure that powers the app itself.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-24 px-8 z-10 relative">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="lg:col-span-1"
            >
              <div className="sticky top-24">
                <h3 className="text-sm font-semibold tracking-wider mb-4" style={{ color: colors.textFaint }}>
                  DOCUMENTATION
                </h3>
                <nav className="flex flex-col gap-2">
                  {navItems.map((item) => (
                    <button
                      key={item}
                      className="text-left px-3 py-2 rounded transition-all text-sm"
                      style={{
                        color: colors.textDim,
                        background: item === 'Getting started' ? colors.surface2 : 'transparent',
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </nav>
              </div>
            </motion.div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Quick Start */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="mb-24"
              >
                <h2
                  className="text-3xl font-bold mb-12"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  Quick start
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
                  {quickstart.map((item, i) => (
                    <div
                      key={i}
                      className="p-6 rounded-3xl border"
                      style={{ background: colors.surface, borderColor: colors.border }}
                    >
                      <item.icon size={24} style={{ color: colors.teal, marginBottom: '12px' }} />
                      <h4 className="font-semibold mb-2">{item.title}</h4>
                      <p className="text-sm" style={{ color: colors.textDim }}>
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Code Example */}
                <div
                  className="p-6 rounded-3xl border font-mono text-sm"
                  style={{ background: colors.surface, borderColor: colors.border }}
                >
                  <div style={{ color: colors.textFaint }}>
                    {'# Get your API key, then:'}<br />
                    <span style={{ color: colors.green }}>const</span> client = <span style={{ color: colors.blue }}>new</span> JVFClient(
                    <span style={{ color: colors.red }}>'"YOUR_API_KEY"'</span>
                    );
                  </div>
                </div>
              </motion.div>

              {/* REST API */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h2
                  className="text-3xl font-bold mb-8"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                >
                  REST API
                </h2>

                <div
                  className="rounded-3xl border overflow-hidden"
                  style={{ borderColor: colors.border }}
                >
                  {endpoints.map((endpoint, i) => (
                    <div
                      key={i}
                      className="p-6 flex items-center gap-4 border-b"
                      style={{
                        background: i % 2 === 0 ? colors.surface : colors.bg,
                        borderColor: colors.border,
                      }}
                    >
                      <div
                        className="px-3 py-1.5 rounded text-xs font-mono font-bold"
                        style={{
                          background:
                            endpoint.method === 'GET'
                              ? colors.green + '22'
                              : endpoint.method === 'POST'
                                ? colors.blue + '22'
                                : colors.red + '22',
                          color:
                            endpoint.method === 'GET'
                              ? colors.green
                              : endpoint.method === 'POST'
                                ? colors.blue
                                : colors.red,
                        }}
                      >
                        {endpoint.method}
                      </div>
                      <div>
                        <div className="font-mono text-sm mb-1" style={{ color: colors.text }}>
                          {endpoint.path}
                        </div>
                        <div className="text-xs" style={{ color: colors.textFaint }}>
                          {endpoint.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-8" style={{ color: colors.textDim }}>
                  <b>Rate limit:</b> 20 requests per second per API key
                </p>
              </motion.div>
            </div>
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
                Ready to build?
              </h2>
              <p style={{ color: colors.textDim }}>
                Create an account and request an API key to get started
              </p>
            </div>
            <Link
              to="/signin"
              className="px-6 py-3.5 rounded-2xl font-semibold text-black text-nowrap flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${colors.blue}, ${colors.teal})` }}
            >
              Get an API key
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

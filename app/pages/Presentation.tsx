import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ShieldCheck, Workflow, Coins, FileText, Lock, Rocket } from 'lucide-react';

const sections = [
  {
    icon: Workflow,
    title: 'Product Flow',
    body: 'Landing -> Buy Tokens -> Portfolio -> Admin Control. Built for both public users and protected admin operations.',
  },
  {
    icon: ShieldCheck,
    title: 'Security Gate',
    body: 'IDO admin and invoice admin routes are gated by wallet allowlist, with explicit fail states and disconnect handling for unauthorized wallets.',
  },
  {
    icon: Coins,
    title: 'Token Utility',
    body: 'WRL token purchase flow is connected to invoice and payment mechanics for operational treasury and campaign tracking.',
  },
  {
    icon: FileText,
    title: 'Invoice System',
    body: 'Create, track, and manage invoices with on-chain sync fallback messaging and route-level admin control.',
  },
  {
    icon: Lock,
    title: 'Admin Controls',
    body: 'Pause controls, sale timing, treasury workflows, and logs are available within the IDO admin panel.',
  },
  {
    icon: Rocket,
    title: 'Launch Readiness',
    body: 'Vite build + Vercel deployment setup with route segregation and environment-driven chain configuration.',
  },
];

export function Presentation() {
  return (
    <div className="min-h-screen px-4 py-12 md:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#11182a] via-[#0b0f1a] to-[#081220] p-8 md:p-12"
        >
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#00F5D4]/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-[#6C5CE7]/20 blur-3xl" />

          <p className="mb-3 inline-flex rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70">
            WeAreLegend Presentation
          </p>
          <h1 className="mb-4 text-4xl font-black leading-tight md:text-6xl">
            <span className="bg-gradient-to-r from-[#6C5CE7] via-[#8AA8FF] to-[#00F5D4] bg-clip-text text-transparent">
              IDO Platform Demo
            </span>
          </h1>
          <p className="max-w-3xl text-base text-white/75 md:text-lg">
            A guided walkthrough page for showing investors, clients, and partners how the platform works, what is secured, and what is ready for launch.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/buy"
              className="rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] px-5 py-3 font-semibold text-white transition-all hover:shadow-[0_0_30px_rgba(108,92,231,0.45)]"
            >
              Open Buy Flow
            </Link>
            <Link
              to="/ido-admin"
              className="rounded-xl border border-white/20 bg-white/5 px-5 py-3 font-semibold text-white/90 transition-all hover:bg-white/10"
            >
              Open IDO Admin
            </Link>
            <Link
              to="/admin"
              className="rounded-xl border border-white/20 bg-white/5 px-5 py-3 font-semibold text-white/90 transition-all hover:bg-white/10"
            >
              Open Invoice Admin
            </Link>
          </div>
        </motion.section>

        <section className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 * index }}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur"
            >
              <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-[#6C5CE7]/30 to-[#00F5D4]/25 p-3">
                <item.icon className="h-5 w-5 text-[#c4f7ef]" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-white">{item.title}</h2>
              <p className="text-sm leading-6 text-white/70">{item.body}</p>
            </motion.article>
          ))}
        </section>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Slide = {
  title: string;
  subtitle: string;
  bullets: string[];
  note: string;
};

const slides: Slide[] = [
  {
    title: 'wearelegend',
    subtitle: 'Secure IDO + Invoice Infrastructure for Web3 Growth',
    bullets: [
      'Product deck mockup for investor and partner demos.',
      'Presentation route embedded directly inside the app.',
      'Built to explain both user journey and admin operations.',
    ],
    note: 'Open with clear positioning: one platform for growth and controlled operations.',
  },
  {
    title: 'The Problem',
    subtitle: 'Token launch operations are fragmented and risky',
    bullets: [
      'Disconnected tools for sale controls, treasury, and billing.',
      'Weak protection around high-privilege admin workflows.',
      'Poor bridge between on-chain actions and business invoicing.',
    ],
    note: 'Position this as an operations problem, not just a UI problem.',
  },
  {
    title: 'The Solution',
    subtitle: 'One platform for launch operations + protected administration',
    bullets: [
      'Public flow: landing, buy, dashboard, portfolio.',
      'IDO admin flow: controls, treasury, logs.',
      'Invoice admin flow: create and manage billing lifecycle.',
    ],
    note: 'Stress the value of continuity across user and admin flows.',
  },
  {
    title: 'Product Flow',
    subtitle: 'From user onboarding to controlled admin execution',
    bullets: [
      'Landing -> Buy Tokens -> Portfolio.',
      'IDO admin route for sale and treasury operations.',
      'Invoice route for payment and invoice workflows.',
    ],
    note: 'Keep this slide visual and simple; use it as transition into security.',
  },
  {
    title: 'Security Model',
    subtitle: 'Wallet allowlist enforced for sensitive routes',
    bullets: [
      'Unauthorized wallets are blocked with fail state messaging.',
      'Guardrails implemented at layout and page level.',
      'Allowlist display is masked to reduce exposure in UI.',
    ],
    note: 'Explain this as defense-in-depth and predictable operator UX.',
  },
  {
    title: 'IDO Admin Operations',
    subtitle: 'Control the launch with visibility',
    bullets: [
      'Sale controls and timing management.',
      'Treasury workflows and approvals context.',
      'Operational logs for audit and review.',
    ],
    note: 'Highlight practical daily operations, not only token sale metrics.',
  },
  {
    title: 'Invoice Layer',
    subtitle: 'Business-ready payment operations for Web3 teams',
    bullets: [
      'Invoice creation and management flows.',
      'Chain sync aware behavior with local cache fallback.',
      'External payment route for customer handoff.',
    ],
    note: 'This is a key differentiator compared to pure launchpad products.',
  },
  {
    title: 'Technical Readiness',
    subtitle: 'Built for reliable shipping and deployment',
    bullets: [
      'React + Vite + TypeScript architecture.',
      'wagmi / viem wallet stack integration.',
      'Environment-driven configuration for production.',
    ],
    note: 'Emphasize that this is an operational product, not a throwaway prototype.',
  },
  {
    title: 'Why We Win',
    subtitle: 'Integrated operations + security guardrails',
    bullets: [
      'Unified flow instead of fragmented toolchain.',
      'Admin protection as first-class behavior.',
      'Fast iteration with clear route boundaries.',
    ],
    note: 'Competitive edge comes from system design, not one isolated feature.',
  },
  {
    title: 'Business Model',
    subtitle: 'Multiple monetization paths',
    bullets: [
      'Launch or raise-based platform fees.',
      'Premium admin modules for advanced operators.',
      'White-label and enterprise deployment options.',
    ],
    note: 'Keep this concise and direct; avoid over-modeling numbers on this pass.',
  },
  {
    title: 'Roadmap',
    subtitle: 'Execution focus across the next two quarters',
    bullets: [
      'Now: deployment stability and admin telemetry depth.',
      'Next: richer role management and analytics modules.',
      'Then: multi-project support and partner integrations.',
    ],
    note: 'Show disciplined sequencing: stability first, then scale.',
  },
  {
    title: 'Call To Action',
    subtitle: 'Partner with us to scale secure launch infrastructure',
    bullets: [
      'Open to investor, strategic partner, and pilot-user discussions.',
      'Live demo path already available in-product.',
      'Next step: align rollout scope and timeline.',
    ],
    note: 'End with one clear ask and invite direct follow-up after demo.',
  },
];

export function Presentation() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        setCurrent((prev) => Math.min(prev + 1, slides.length - 1));
      }
      if (event.key === 'ArrowLeft') {
        setCurrent((prev) => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const active = slides[current];
  const progress = ((current + 1) / slides.length) * 100;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_10%,rgba(0,245,212,0.12),transparent_35%),radial-gradient(circle_at_85%_80%,rgba(108,92,231,0.2),transparent_35%),#070B14] px-4 py-10 md:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-4 flex items-center justify-between text-xs text-white/70">
          <span>wearelegend deck mockup</span>
          <span>
            Slide {current + 1} / {slides.length}
          </span>
        </div>

        <div className="mb-6 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4]" style={{ width: `${progress}%` }} />
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0A1020]/80 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 gap-8 lg:grid-cols-[1.35fr_0.65fr]"
            >
              <div>
                <p className="mb-3 inline-flex rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/60">
                  slide theme
                </p>
                <h1 className="mb-3 text-3xl font-black leading-tight text-white md:text-5xl">{active.title}</h1>
                <p className="mb-7 max-w-3xl text-base text-white/75 md:text-xl">{active.subtitle}</p>

                <ul className="space-y-3">
                  {active.bullets.map((item) => (
                    <li key={item} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[#00F5D4]" />
                      <span className="text-sm text-white/80 md:text-base">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <aside className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-4">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-white/60">Presenter Note</h2>
                <p className="text-sm leading-6 text-white/75">{active.note}</p>

                <div className="mt-6 space-y-2 text-xs text-white/60">
                  <p>Use Left and Right arrow keys to navigate slides.</p>
                  <p>For live demo: open product routes below.</p>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-2">
                  <Link to="/buy" className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-center text-sm text-white/90 hover:bg-white/10">
                    Open Buy
                  </Link>
                  <Link to="/ido-admin" className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-center text-sm text-white/90 hover:bg-white/10">
                    Open IDO Admin
                  </Link>
                  <Link to="/admin" className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-center text-sm text-white/90 hover:bg-white/10">
                    Open Invoice Admin
                  </Link>
                </div>
              </aside>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <button
            onClick={() => setCurrent((prev) => Math.max(prev - 1, 0))}
            disabled={current === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <div className="hidden flex-wrap justify-center gap-2 md:flex">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrent(index)}
                className={`h-2 w-8 rounded-full transition-all ${
                  index === current ? 'bg-[#00F5D4]' : 'bg-white/20 hover:bg-white/35'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrent((prev) => Math.min(prev + 1, slides.length - 1))}
            disabled={current === slides.length - 1}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

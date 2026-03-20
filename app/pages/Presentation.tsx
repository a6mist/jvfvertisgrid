import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Slide = {
  section: string;
  title: string;
  subtitle: string;
  bullets: string[];
  note: string;
  calloutTitle?: string;
  calloutPoints?: string[];
};

const slides: Slide[] = [
  {
    section: 'Abstract',
    title: 'wearelegend',
    subtitle: 'A security-forward launch and payment operations protocol for Web3 teams',
    bullets: [
      'Unifies token sale execution, treasury governance, and invoice operations.',
      'Separates public participation flows from privileged operator routes.',
      'Prioritizes auditability and operational control over growth-only UX.',
    ],
    note: 'Frame this as infrastructure: wearelegend is built to run operations safely at scale.',
  },
  {
    section: 'Problem Statement',
    title: 'Operational Fragmentation',
    subtitle: 'Most launch teams stitch tools that were never designed to work together',
    bullets: [
      'Sale controls, treasury actions, and invoicing are often siloed.',
      'Admin surfaces are commonly overexposed to unauthorized operations.',
      'Post-launch finance workflows lack on-chain context and traceability.',
    ],
    note: 'Anchor the narrative around execution risk, not feature gaps.',
  },
  {
    section: 'Protocol Objective',
    title: 'Integrated Control Plane',
    subtitle: 'One system for user acquisition, admin governance, and billing reliability',
    bullets: [
      'Public modules: onboarding, buy flow, dashboard, and portfolio visibility.',
      'Admin modules: controls, treasury, and log-driven oversight.',
      'Invoice modules: create, manage, and settle payment-linked workflows.',
    ],
    note: 'This is a systems slide: show how the modules reinforce each other.',
  },
  {
    section: 'System Architecture',
    title: 'Operational Topology',
    subtitle: 'Deterministic route boundaries for public and privileged actions',
    bullets: [
      'Landing -> Buy Tokens -> Portfolio.',
      'IDO admin route for sale states, treasury requests, and logs.',
      'Invoice admin route for billing generation and lifecycle management.',
    ],
    note: 'Use this as the handoff into threat model and access control.',
  },
  {
    section: 'Access Control',
    title: 'Wallet-Gated Privileged Surfaces',
    subtitle: 'Sensitive routes are allowlisted and fail-closed by default',
    bullets: [
      'Unauthorized wallets are blocked with fail state messaging.',
      'Guardrails implemented at layout and page level.',
      'Allowlist display is masked to reduce exposure in UI.',
    ],
    note: 'Describe this as defense-in-depth with predictable UX for operations teams.',
  },
  {
    section: 'Treasury Governance',
    title: 'Multisig / Co-sign Execution Logic',
    subtitle: 'Treasury withdrawals require signer consensus before execution',
    bullets: [
      'Withdrawal lifecycle: RequestCreated -> Approved -> Executed events.',
      'Each request tracks signer approvals versus required threshold.',
      'Execution is enabled only after threshold consensus is reached.',
    ],
    note: 'Current UI messaging indicates a 3-of-3 multisig requirement for treasury withdrawals.',
    calloutTitle: 'Co-sign Flow (3/3 in current treasury view)',
    calloutPoints: [
      '1) Signer creates a withdraw request with token, amount, recipient, and purpose.',
      '2) Co-signers independently submit approvals; each approval is immutably logged.',
      '3) When approvals >= requiredApprovals, request status transitions to Approved.',
      '4) Any eligible signer can trigger execute; funds move only at this final step.',
    ],
  },
  {
    section: 'Payment Rail',
    title: 'Invoice Subsystem',
    subtitle: 'Business-ready billing with chain-aware synchronization',
    bullets: [
      'Invoice creation and management flows.',
      'Chain sync aware behavior with local cache fallback.',
      'External payment route for customer handoff.',
    ],
    note: 'Highlight this as protocol-to-business bridge, not just UI convenience.',
  },
  {
    section: 'Implementation',
    title: 'Technical Baseline',
    subtitle: 'Built for deterministic deployment and maintainable evolution',
    bullets: [
      'React + Vite + TypeScript architecture.',
      'wagmi / viem wallet stack integration.',
      'Environment-driven configuration for production.',
    ],
    note: 'Reinforce that reliability and deployability are design constraints, not afterthoughts.',
  },
  {
    section: 'Token & Economics',
    title: 'Token Utility and Value Loop',
    subtitle: 'Operational demand and governance constraints reinforce utility',
    bullets: [
      'Token sale participation drives ecosystem entry.',
      'Treasury governance protects capital movement pathways.',
      'Invoice workflows create recurring business-side usage contexts.',
    ],
    note: 'Keep claims conservative and map utility to concrete product surfaces.',
  },
  {
    section: 'Monetization',
    title: 'Revenue Surfaces',
    subtitle: 'Multi-channel monetization with protocol-aligned incentives',
    bullets: [
      'Launch or raise-based platform fees.',
      'Premium admin modules for advanced operators.',
      'White-label and enterprise deployment options.',
    ],
    note: 'Treat this as model scaffolding; add numeric assumptions in investor edition.',
  },
  {
    section: 'Roadmap',
    title: 'Roadmap and Milestones',
    subtitle: 'Security depth first, expansion second',
    bullets: [
      'Now: deployment stability and admin telemetry depth.',
      'Next: richer role management and analytics modules.',
      'Then: multi-project support and partner integrations.',
    ],
    note: 'Roadmap credibility comes from sequencing and measurable release goals.',
  },
  {
    section: 'Conclusion',
    title: 'Strategic Ask',
    subtitle: 'Back a security-first Web3 operations stack',
    bullets: [
      'Open to investor, strategic partner, and pilot-user discussions.',
      'Live demo path already available in-product.',
      'Next step: align rollout scope and timeline.',
    ],
    note: 'Close with one ask and move directly into live product walkthrough.',
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
          <span>wearelegend whitepaper presentation</span>
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
                  {active.section}
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

                {active.calloutTitle && active.calloutPoints ? (
                  <div className="mt-6 rounded-2xl border border-[#00F5D4]/25 bg-[#00F5D4]/5 p-4">
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#9bfdf0]">
                      {active.calloutTitle}
                    </h3>
                    <ul className="space-y-2">
                      {active.calloutPoints.map((point) => (
                        <li key={point} className="text-sm text-white/80">
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
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

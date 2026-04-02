type CharityMissionBarProps = {
  className?: string;
};

const resolveNetworkLabel = () => {
  const mode = String(import.meta.env.VITE_NETWORK_MODE || '').trim().toUpperCase();
  if (mode === 'TRON' || mode === 'TRC' || mode === 'TRC20') {
    return 'TRON / TRC20';
  }

  return 'EVM';
};

export function CharityMissionBar({ className = '' }: CharityMissionBarProps) {
  const networkLabel = resolveNetworkLabel();

  return (
    <section
      className={`border-b border-emerald-300/20 bg-[linear-gradient(90deg,rgba(11,15,26,0.95),rgba(7,38,33,0.92),rgba(11,15,26,0.95))] ${className}`.trim()}
      aria-label="Charity mission"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-2 text-xs text-emerald-100 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="leading-relaxed">
          <span className="font-semibold text-emerald-300">Charity First:</span>{' '}
          Bahagi ng kita ng platform ay inilalaan sa community aid, youth programs, at livelihood support.
        </p>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-emerald-200">
          <span>Network Plan:</span>
          <span>{networkLabel}</span>
        </div>
      </div>
    </section>
  );
}

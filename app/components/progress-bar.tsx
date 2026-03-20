interface ProgressBarProps {
  current: number;
  max: number;
}

export function ProgressBar({ current, max }: ProgressBarProps) {
  const percentage = Math.min((current / max) * 100, 100);

  return (
    <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden border border-white/10">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] transition-all duration-500 relative"
        style={{ width: `${percentage}%` }}
      >
        <div className="absolute inset-0 bg-white/20 animate-pulse" />
      </div>
    </div>
  );
}

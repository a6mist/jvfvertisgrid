interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  onLabel?: string;
  offLabel?: string;
  onStatus?: string;
  offStatus?: string;
}

export function ToggleSwitch({
  checked,
  onChange,
  onLabel = "On",
  offLabel = "Off",
  onStatus = "Approved / Success",
  offStatus = "Declined / Failed",
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      aria-label={`${checked ? onLabel : offLabel}: ${checked ? onStatus : offStatus}`}
      className={`relative w-36 h-9 rounded-full transition-all ${
        checked ? "bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4]" : "bg-white/20"
      }`}
    >
      <div
        className={`absolute top-1 left-1 w-7 h-7 rounded-full bg-white transition-transform ${
          checked ? "translate-x-[6.5rem]" : "translate-x-0"
        }`}
      />
      <span className="absolute inset-0 flex items-center justify-between px-3 text-[10px] font-semibold uppercase tracking-wide text-white">
        <span className={checked ? "opacity-60" : ""}>{checked ? onLabel : offLabel}</span>
        <span className={checked ? "" : "opacity-60"}>{checked ? onStatus : offStatus}</span>
      </span>
    </button>
  );
}

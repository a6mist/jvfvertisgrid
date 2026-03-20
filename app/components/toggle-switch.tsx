interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleSwitch({ checked, onChange }: ToggleSwitchProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-14 h-7 rounded-full transition-all ${
        checked ? "bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4]" : "bg-white/20"
      }`}
    >
      <div
        className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
          checked ? "translate-x-7" : "translate-x-0"
        }`}
      />
    </button>
  );
}

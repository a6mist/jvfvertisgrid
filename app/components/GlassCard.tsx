import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}

export const GlassCard = ({ children, className = '', glow = false }: GlassCardProps) => {
  return (
    <div
      className={`
        relative rounded-2xl p-6
        bg-gradient-to-br from-white/5 to-white/[0.02]
        backdrop-blur-xl
        border border-white/10
        ${glow ? 'shadow-[0_0_40px_rgba(108,92,231,0.3)]' : ''}
        ${className}
      `}
    >
      {glow && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#6C5CE7]/20 to-[#00F5D4]/20 blur-xl -z-10" />
      )}
      {children}
    </div>
  );
};

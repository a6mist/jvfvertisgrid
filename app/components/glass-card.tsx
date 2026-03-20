import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div
      className={`p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl ${className}`}
      style={{
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      }}
    >
      {children}
    </div>
  );
}

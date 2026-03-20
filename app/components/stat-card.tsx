import { LucideIcon } from "lucide-react";
import { GlassCard } from "./glass-card";

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  color: "purple" | "aqua";
  pulse?: boolean;
}

export function StatCard({ title, value, subtitle, icon: Icon, color, pulse }: StatCardProps) {
  const colorClass = color === "purple" ? "text-[#6C5CE7]" : "text-[#00F5D4]";
  const bgClass = color === "purple" ? "bg-[#6C5CE7]/20" : "bg-[#00F5D4]/20";
  const hoverGlowClass = color === "purple" ? "hover:shadow-[0_0_20px_rgba(108,92,231,0.3)]" : "hover:shadow-[0_0_20px_rgba(0,245,212,0.3)]";

  return (
    <GlassCard className={`transition-all duration-300 ${hoverGlowClass} cursor-default`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">{title}</span>
          <div className={`w-10 h-10 rounded-xl ${bgClass} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${colorClass} ${pulse ? "animate-pulse" : ""}`} />
          </div>
        </div>
        <div>
          <p className="text-2xl text-white mb-1">{value}</p>
          <p className="text-xs text-white/50">{subtitle}</p>
        </div>
      </div>
    </GlassCard>
  );
}
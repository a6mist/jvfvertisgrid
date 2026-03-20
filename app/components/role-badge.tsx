import { Shield, Key, FileSignature, User } from "lucide-react";

interface RoleBadgeProps {
  role: "Owner" | "Admin" | "Signer" | "Viewer";
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const config = {
    Owner: {
      icon: Shield,
      color: "from-[#6C5CE7] to-[#00F5D4]",
      bg: "bg-[#6C5CE7]/20",
    },
    Admin: {
      icon: Key,
      color: "from-[#00F5D4] to-[#6C5CE7]",
      bg: "bg-[#00F5D4]/20",
    },
    Signer: {
      icon: FileSignature,
      color: "from-[#8B7FF5] to-[#6C5CE7]",
      bg: "bg-[#8B7FF5]/20",
    },
    Viewer: {
      icon: User,
      color: "from-slate-400 to-slate-200",
      bg: "bg-slate-400/20",
    },
  };

  const { icon: Icon, color, bg } = config[role] ?? config.Viewer;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg ${bg} border border-white/10`}>
      <Icon className={`w-4 h-4 bg-gradient-to-r ${color} bg-clip-text text-transparent`} />
      <span className={`text-sm bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
        {role}
      </span>
    </div>
  );
}

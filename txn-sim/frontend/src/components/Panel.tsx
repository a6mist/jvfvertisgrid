import { ReactNode } from "react";

export function Panel({ title, action, children, className = "" }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`bg-console-panel border border-console-border rounded-lg shadow-panel ${className}`}>
      {title && (
        <div className="flex items-center justify-between border-b border-console-border px-4 py-3">
          <h3 className="text-sm font-medium text-console-text">{title}</h3>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "teal" | "red" | "amber" | "blue";
}) {
  const toneClass = {
    default: "text-console-text",
    teal: "text-accent-teal",
    red: "text-accent-red",
    amber: "text-accent-amber",
    blue: "text-accent-blue",
  }[tone];

  return (
    <div className="bg-console-panel border border-console-border rounded-lg shadow-panel px-4 py-3.5">
      <div className="text-xs uppercase tracking-wider text-console-textFaint mb-1.5">{label}</div>
      <div className={`text-2xl font-semibold data-mono ${toneClass}`}>{value}</div>
    </div>
  );
}

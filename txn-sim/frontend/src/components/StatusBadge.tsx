const STYLES: Record<string, string> = {
  SUCCESS: "bg-accent-teal/10 text-accent-teal border-accent-teal/30",
  VERIFIED: "bg-accent-teal/10 text-accent-teal border-accent-teal/30",
  WARNING: "bg-accent-amber/10 text-accent-amber border-accent-amber/30",
  FAILED: "bg-accent-red/10 text-accent-red border-accent-red/30",
  PENDING: "bg-accent-blue/10 text-accent-blue border-accent-blue/30",
  RUNNING: "bg-accent-blue/10 text-accent-blue border-accent-blue/30",
  SKIPPED: "bg-console-textFaint/10 text-console-textFaint border-console-borderLight",
  INFO: "bg-accent-blue/10 text-accent-blue border-accent-blue/30",
};

export function StatusBadge({ status }: { status: string }) {
  const style = STYLES[status] ?? "bg-console-panelAlt text-console-textDim border-console-border";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium data-mono ${style}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

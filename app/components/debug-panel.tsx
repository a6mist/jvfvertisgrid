import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "./glass-card";
import { Bug, ChevronDown, ChevronUp, ShieldAlert, Wifi, Wallet, Trash2 } from "lucide-react";
import { useIdoAdmin } from "../hooks/useIdoAdmin";

type DiagnosticKind = "wallet-rejected" | "rpc-dapp" | "extension-noise" | "unknown";

type DiagnosticEntry = {
  id: number;
  kind: DiagnosticKind;
  message: string;
  source: string;
  timestamp: number;
};

const classifyDiagnostic = (message: string, source: string): DiagnosticKind => {
  const normalized = `${message} ${source}`.toLowerCase();

  if (
    normalized.includes("user rejected") ||
    normalized.includes("user denied") ||
    normalized.includes("signature")
  ) {
    return "wallet-rejected";
  }

  if (
    normalized.includes("rpc") ||
    normalized.includes("contractfunctionexecutionerror") ||
    normalized.includes("rpcrequesterror") ||
    normalized.includes("eth_getlogs") ||
    normalized.includes("exceed maximum block range")
  ) {
    return "rpc-dapp";
  }

  if (
    normalized.includes("chrome-extension") ||
    normalized.includes("injected.js") ||
    normalized.includes("sentry-install.js") ||
    normalized.includes("runtime-lavamoat") ||
    normalized.includes("snap_") ||
    normalized.includes("bfcache") ||
    normalized.includes("event handler of <some> event") ||
    normalized.includes("tabreply")
  ) {
    return "extension-noise";
  }

  return "unknown";
};

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticEntry[]>([]);
  const { isContractsConfigured, stats } = useIdoAdmin();

  const debugData = {
    currentTimestamp: Math.floor(Date.now() / 1000),
    contractsConfigured: isContractsConfigured,
    saleStartTime: stats.startTime,
    saleEndTime: stats.endTime,
    isSaleActive:
      stats.startTime > 0 &&
      stats.endTime > 0 &&
      Math.floor(Date.now() / 1000) >= stats.startTime &&
      Math.floor(Date.now() / 1000) <= stats.endTime,
    totalSold: stats.totalSold,
    totalUsdtCollected: stats.totalUsdtCollected,
    maxTokens: stats.maxTokens,
    currentTier: stats.currentTier,
    currentPrice: stats.currentPrice,
    buyPaused: stats.isBuyPaused,
    claimPaused: stats.isClaimPaused,
    released: stats.released,
    adminCount: stats.admins.length,
    signerCount: stats.signers.length,
    requiredApprovals: stats.requiredApprovals,
  };

  useEffect(() => {
    const MAX_ENTRIES = 20;

    const addDiagnostic = (message: string, source: string) => {
      const kind = classifyDiagnostic(message, source);
      setDiagnostics((prev) => [
        {
          id: Date.now() + Math.floor(Math.random() * 1000),
          kind,
          message,
          source,
          timestamp: Date.now(),
        },
        ...prev,
      ].slice(0, MAX_ENTRIES));
    };

    const onWindowError = (event: ErrorEvent) => {
      const message = event.message || "Unknown runtime error";
      const source = event.filename || "window.onerror";
      addDiagnostic(message, source);
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        typeof reason === "string"
          ? reason
          : (reason as { message?: string })?.message || "Unhandled promise rejection";
      addDiagnostic(message, "unhandledrejection");
    };

    window.addEventListener("error", onWindowError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onWindowError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  const diagnosticSummary = useMemo(() => {
    return diagnostics.reduce(
      (acc, entry) => {
        acc[entry.kind] = (acc[entry.kind] || 0) + 1;
        return acc;
      },
      {
        "wallet-rejected": 0,
        "rpc-dapp": 0,
        "extension-noise": 0,
        unknown: 0,
      } as Record<DiagnosticKind, number>,
    );
  }, [diagnostics]);

  const kindStyle: Record<DiagnosticKind, string> = {
    "wallet-rejected": "text-yellow-300 border-yellow-500/30 bg-yellow-500/10",
    "rpc-dapp": "text-red-300 border-red-500/30 bg-red-500/10",
    "extension-noise": "text-cyan-300 border-cyan-500/30 bg-cyan-500/10",
    unknown: "text-white/70 border-white/20 bg-white/5",
  };

  const kindLabel: Record<DiagnosticKind, string> = {
    "wallet-rejected": "Wallet Rejected",
    "rpc-dapp": "RPC / Dapp Error",
    "extension-noise": "Extension Noise",
    unknown: "Unclassified",
  };

  return (
    <GlassCard className="border-[#00F5D4]/30">
      <div className="space-y-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00F5D4]/20 flex items-center justify-center">
              <Bug className="w-5 h-5 text-[#00F5D4]" />
            </div>
            <div className="text-left">
              <h3 className="text-white">Debug Panel</h3>
              <p className="text-sm text-white/60">Development mode information</p>
            </div>
          </div>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-white/60" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white/60" />
          )}
        </button>

        {isOpen && (
          <div className="pt-4 border-t border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-sm mb-6">
              {Object.entries(debugData).map(([key, value]) => (
                <div key={key} className="p-3 rounded-lg bg-white/5">
                  <p className="text-white/60 text-xs mb-1">{key}</p>
                  <p className="text-white break-all">
                    {typeof value === "boolean" ? (
                      <span className={value ? "text-[#00F5D4]" : "text-red-400"}>
                        {value.toString()}
                      </span>
                    ) : (
                      value
                    )}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-3 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white">Runtime Diagnostics</h4>
                  <p className="text-xs text-white/60">
                    Captures runtime errors and classifies wallet, RPC, and extension noise.
                  </p>
                </div>
                <button
                  onClick={() => setDiagnostics([])}
                  className="px-3 py-2 rounded-lg border border-white/10 text-white/70 hover:text-white hover:bg-white/5 text-xs flex items-center gap-2"
                >
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-300">
                  <div className="flex items-center gap-2 mb-1"><Wallet className="w-3 h-3" /> Wallet Rejected</div>
                  <div className="text-lg">{diagnosticSummary["wallet-rejected"]}</div>
                </div>
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300">
                  <div className="flex items-center gap-2 mb-1"><Wifi className="w-3 h-3" /> RPC / Dapp</div>
                  <div className="text-lg">{diagnosticSummary["rpc-dapp"]}</div>
                </div>
                <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                  <div className="flex items-center gap-2 mb-1"><ShieldAlert className="w-3 h-3" /> Extension Noise</div>
                  <div className="text-lg">{diagnosticSummary["extension-noise"]}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-white/70">
                  <div className="mb-1">Unclassified</div>
                  <div className="text-lg">{diagnosticSummary.unknown}</div>
                </div>
              </div>

              <div className="text-xs text-white/60 p-3 rounded-lg bg-white/5 border border-white/10">
                Tip: If message source contains sentry-install.js, runtime-lavamoat, injected.js, or chrome-extension, it is usually extension-side noise and not a website bug.
              </div>

              <div className="space-y-2 max-h-56 overflow-auto pr-1">
                {diagnostics.length === 0 ? (
                  <div className="text-xs text-white/50 p-3 rounded-lg bg-white/5 border border-white/10">
                    No runtime issues captured yet in this session.
                  </div>
                ) : (
                  diagnostics.map((entry) => (
                    <div
                      key={entry.id}
                      className={`p-3 rounded-lg border text-xs ${kindStyle[entry.kind]}`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-semibold">{kindLabel[entry.kind]}</span>
                        <span className="opacity-70">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="break-all">{entry.message}</p>
                      <p className="mt-1 opacity-80 break-all">source: {entry.source}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

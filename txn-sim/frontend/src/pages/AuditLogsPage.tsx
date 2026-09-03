import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Panel } from "../components/Panel";
import { StatusBadge } from "../components/StatusBadge";

export function AuditLogsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [eventType, setEventType] = useState("");
  const [protocolCode, setProtocolCode] = useState("");
  const [protocols, setProtocols] = useState<any[]>([]);

  useEffect(() => {
    api.get("/protocols").then((res) => setProtocols(res.data.protocols));
  }, []);

  useEffect(() => {
    const params: Record<string, string> = { pageSize: "100" };
    if (eventType) params.eventType = eventType;
    if (protocolCode) params.protocolCode = protocolCode;
    api.get("/audit-logs", { params }).then((res) => {
      setItems(res.data.items);
      setTotal(res.data.total);
    });
  }, [eventType, protocolCode]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Audit Logs</h1>
        <p className="text-sm text-console-textFaint mt-1">
          Immutable-style record of every simulation event. No authentication secrets are ever logged here.
        </p>
      </div>

      <Panel>
        <div className="flex gap-2 mb-4">
          <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="rounded-md bg-console-panelAlt border border-console-border px-3 py-2 text-sm">
            <option value="">All event types</option>
            <option value="SIMULATION_CREATED">SIMULATION_CREATED</option>
            <option value="SIMULATION_COMPLETED">SIMULATION_COMPLETED</option>
          </select>
          <select value={protocolCode} onChange={(e) => setProtocolCode(e.target.value)} className="rounded-md bg-console-panelAlt border border-console-border px-3 py-2 text-sm">
            <option value="">All protocols</option>
            {protocols.map((p) => (
              <option key={p.code} value={p.code}>
                {p.code}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-console-textFaint text-xs uppercase tracking-wide border-b border-console-border">
                <th className="py-2 pr-4">Event ID</th>
                <th className="py-2 pr-4">Transaction Ref</th>
                <th className="py-2 pr-4">Protocol</th>
                <th className="py-2 pr-4">Event Type</th>
                <th className="py-2 pr-4">Result</th>
                <th className="py-2 pr-4">Actor</th>
                <th className="py-2 pr-4">System Version</th>
                <th className="py-2 pr-4">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {items.map((log) => (
                <tr key={log.id} className="border-b border-console-border/60 hover:bg-console-panelAlt/50">
                  <td className="py-2 pr-4 data-mono text-console-textFaint text-xs">{log.id.slice(0, 8)}</td>
                  <td className="py-2 pr-4 data-mono text-accent-teal">{log.transactionRef ?? "—"}</td>
                  <td className="py-2 pr-4 data-mono text-console-textDim">{log.protocolCode ?? "—"}</td>
                  <td className="py-2 pr-4 text-console-textDim">{log.eventType}</td>
                  <td className="py-2 pr-4">{log.result ? <StatusBadge status={log.result} /> : "—"}</td>
                  <td className="py-2 pr-4 text-console-textFaint text-xs">{log.actor?.name ?? "system"}</td>
                  <td className="py-2 pr-4 data-mono text-console-textFaint text-xs">{log.systemVersion}</td>
                  <td className="py-2 pr-4 text-console-textFaint text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-console-textFaint text-sm">
                    No audit events match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-3 text-xs text-console-textFaint">{total} total events</div>
      </Panel>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

interface Transaction {
  id: number;
  testTransactionId: string;
  status: string;
  protocol?: { code: string };
  cardNetwork: string;
  createdAt: string;
}

export function ControlsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [approvedEnabled, setApprovedEnabled] = useState(true);
  const [declinedEnabled, setDeclinedEnabled] = useState(false);

  useEffect(() => {
    api.get("/simulations", { params: { page: "1", pageSize: "20" } })
      .then((res) => setTransactions(res.data.items ?? []))
      .catch(() => setTransactions([]));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Controls</h1>
        <p className="text-sm text-console-textFaint mt-1">
          Approval status for verified protocol transactions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <OutcomeCard enabled={approvedEnabled} onChange={setApprovedEnabled} label="Approved" result="Success" />
        <OutcomeCard enabled={declinedEnabled} onChange={setDeclinedEnabled} label="Declined" result="Failed" />
      </div>

      <section className="rounded-md border border-console-border bg-console-panel">
        <div className="border-b border-console-border px-4 py-3">
          <h2 className="text-sm font-semibold">Transaction outcomes</h2>
          <p className="text-xs text-console-textFaint mt-1">On means Approved and Success. Off means Declined and Failed.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-console-textFaint text-xs uppercase tracking-wide border-b border-console-border">
                <th className="py-2 px-4">Transaction ID</th>
                <th className="py-2 pr-4">Protocol</th>
                <th className="py-2 pr-4">Network</th>
                <th className="py-2 pr-4">Approval</th>
                <th className="py-2 pr-4">When</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => {
                const enabled = transaction.status === "VERIFIED" || transaction.status === "SUCCESS" || transaction.status === "APPROVED";
                return (
                  <tr key={transaction.id} className="border-b border-console-border/60">
                    <td className="py-2 px-4">
                      <Link to={`/transactions/${transaction.id}`} className="data-mono text-accent-teal hover:underline">
                        {transaction.testTransactionId}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 data-mono text-console-textDim">{transaction.protocol?.code ?? "—"}</td>
                    <td className="py-2 pr-4 text-console-textDim">{transaction.cardNetwork}</td>
                    <td className="py-2 pr-4"><OutcomeToggle enabled={enabled} /></td>
                    <td className="py-2 pr-4 text-xs text-console-textFaint">{new Date(transaction.createdAt).toLocaleString()}</td>
                  </tr>
                );
              })}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-console-textFaint">No transaction outcomes yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function OutcomeCard({ enabled, onChange, label, result }: { enabled: boolean; onChange: (enabled: boolean) => void; label: string; result: string }) {
  return (
    <div className="rounded-md border border-console-border bg-console-panel p-4">
      <div className="text-xs uppercase tracking-wide text-console-textFaint">{label}</div>
      <div className="mt-3"><OutcomeToggle enabled={enabled} onChange={onChange} /></div>
      <div className="mt-3 text-xs text-console-textDim">{result}</div>
    </div>
  );
}

function OutcomeToggle({ enabled, onChange }: { enabled: boolean; onChange?: (enabled: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange?.(!enabled)}
      role="switch"
      aria-checked={enabled}
      aria-label={enabled ? "On: Approved / Success" : "Off: Declined / Failed"}
      className={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-colors hover:brightness-110 ${
        enabled ? "border-accent-teal/40 bg-accent-teal/10 text-accent-teal" : "border-accent-red/40 bg-accent-red/10 text-accent-red"
      }`}
    >
      <span className={`relative h-4 w-7 rounded-full ${enabled ? "bg-accent-teal" : "bg-accent-red/70"}`}>
        <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-console-bg ${enabled ? "translate-x-3.5" : "translate-x-0.5"}`} />
      </span>
      <span>{enabled ? "On" : "Off"}</span>
      <span className="normal-case tracking-normal">{enabled ? "Approved / Success" : "Declined / Failed"}</span>
    </button>
  );
}

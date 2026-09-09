import { ReactNode, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { Panel } from "../components/Panel";
import { StatusBadge } from "../components/StatusBadge";

const PAGE_SIZE = 15;

export function TransactionsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [network, setNetwork] = useState("");
  const [status, setStatus] = useState("");
  const [protocolCode, setProtocolCode] = useState("");
  const [protocols, setProtocols] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/protocols").then((res) => setProtocols(res.data.protocols));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { page: String(page), pageSize: String(PAGE_SIZE) };
    if (search) params.search = search;
    if (network) params.network = network;
    if (status) params.status = status;
    if (protocolCode) params.protocolCode = protocolCode;

    api
      .get("/simulations", { params })
      .then((res) => {
        setItems(res.data.items);
        setTotal(res.data.total);
      })
      .finally(() => setLoading(false));
  }, [page, search, network, status, protocolCode]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Transactions</h1>
        <p className="text-sm text-console-textFaint mt-1">Searchable history of transaction.</p>
      </div>

      <Panel>
        <div className="flex flex-wrap gap-2 mb-4">
          <input
            placeholder="Search ID, reference, card ref…"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="flex-1 min-w-[200px] rounded-md bg-console-panelAlt border border-console-border px-3 py-2 text-sm focus:border-accent-teal outline-none"
          />
          <select
            value={protocolCode}
            onChange={(e) => {
              setPage(1);
              setProtocolCode(e.target.value);
            }}
            className="rounded-md bg-console-panelAlt border border-console-border px-3 py-2 text-sm"
          >
            <option value="">All protocols</option>
            {protocols.map((p) => (
              <option key={p.code} value={p.code}>
                {p.code}
              </option>
            ))}
          </select>
          <select
            value={network}
            onChange={(e) => {
              setPage(1);
              setNetwork(e.target.value);
            }}
            className="rounded-md bg-console-panelAlt border border-console-border px-3 py-2 text-sm"
          >
            <option value="">All networks</option>
            <option value="VISA">VISA</option>
            <option value="MASTERCARD">MASTERCARD</option>
          </select>
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className="rounded-md bg-console-panelAlt border border-console-border px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="RUNNING">Running</option>
            <option value="VERIFIED">Verified</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-console-textFaint text-xs uppercase tracking-wide border-b border-console-border">
                <th className="py-2 pr-4">Transaction ID</th>
                <th className="py-2 pr-4">Date/Time</th>
                <th className="py-2 pr-4">Protocol</th>
                <th className="py-2 pr-4">Network</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Card Ref</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Result</th>
                <th className="py-2 pr-4">Duration</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((tx) => (
                <tr key={tx.id} className="border-b border-console-border/60 hover:bg-console-panelAlt/50">
                  <td className="py-2 pr-4 data-mono text-accent-teal">
                    <Link to={`/transactions/${tx.id}`} className="hover:underline">
                      {tx.testTransactionId}
                    </Link>
                  </td>
                  <td className="py-2 pr-4 text-xs text-console-textFaint">{new Date(tx.createdAt).toLocaleString()}</td>
                  <td className="py-2 pr-4 data-mono text-console-textDim">{tx.protocol?.code}</td>
                  <td className="py-2 pr-4 text-console-textDim">{tx.cardNetwork}</td>
                  <td className="py-2 pr-4 data-mono">
                    {tx.currency} {Number(tx.amount).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4 data-mono text-console-textFaint">{tx.syntheticCardRef?.replace(/^TEST-/, "")}</td>
                  <td className="py-2 pr-4">
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="py-2 pr-4 text-console-textDim">{tx.overallResult ?? "—"}</td>
                  <td className="py-2 pr-4 data-mono text-console-textFaint">
                    {tx.processingDurationMs ? `${tx.processingDurationMs} ms` : "—"}
                  </td>
                  <td className="py-2 pr-4">
                    <button onClick={() => navigate(`/transactions/${tx.id}`)} className="text-xs text-accent-teal hover:underline">
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-console-textFaint text-sm">
                    No simulations match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4 text-xs text-console-textFaint">
          <div>
            {total} total · page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2 py-1 rounded border border-console-border disabled:opacity-40"
            >
              Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2 py-1 rounded border border-console-border disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </Panel>
    </div>
  );
}

export function TransactionDetailPage() {
  const { id } = useParams();
  const [simulation, setSimulation] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  function load() {
    if (!id) return;
    setLoading(true);
    api
      .get(`/simulations/${id}`)
      .then((res) => setSimulation(res.data.simulation))
      .catch((err) => setError(err?.response?.data?.error ?? "Unable to load simulation."))
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  async function runVerification() {
    if (!id) return;
    setVerifying(true);
    try {
      await api.post(`/simulations/${id}/verify`);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Verification failed to run.");
    } finally {
      setVerifying(false);
    }
  }

  if (loading) return <div className="text-sm text-console-textDim">Loading…</div>;
  if (error) return <div className="text-sm text-accent-red">{error}</div>;
  if (!simulation) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold data-mono">{simulation.testTransactionId}</h1>
          <p className="text-sm text-console-textFaint mt-1">Verification report</p>
        </div>
        {simulation.status === "PENDING" && (
          <button
            onClick={runVerification}
            disabled={verifying}
            className="rounded-md bg-accent-teal text-console-bg font-medium text-sm px-4 py-2 hover:bg-accent-teal/90 disabled:opacity-60"
          >
            {verifying ? "Running…" : "Run Simulation"}
          </button>
        )}
      </div>

      <div className="bg-accent-amber/10 border border-accent-amber/30 text-accent-amber text-xs rounded-md px-3 py-2">
        RESULT — THIS RESULT REPRESENT AUTHORIZATION OR VERIFICATION BY VISA, MASTERCARD, A
        BANK, OR ANY PAYMENT NETWORK.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Transaction information">
          <dl className="text-sm space-y-2">
            <Row label="Transaction ID" value={simulation.testTransactionId} mono />
            <Row label="Protocol" value={`${simulation.protocol.code} — ${simulation.protocol.name}`} />
            <Row label="Network" value={simulation.cardNetwork} />
            <Row label="Transaction type" value={simulation.transactionType} />
            <Row label="Amount" value={`${simulation.currency} ${Number(simulation.amount).toLocaleString()}`} mono />
            <Row label="Timestamp" value={new Date(simulation.createdAt).toLocaleString()} />
            <Row label="Reference number" value={simulation.referenceNumber} mono />
          </dl>
        </Panel>

        <Panel title="Card information">
          <dl className="text-sm space-y-2">
            <Row label="Card reference" value={simulation.syntheticCardRef?.replace(/^TEST-/, "")} mono />
            <Row label="Card network" value={simulation.cardNetwork} />
            <Row label="Card type" value={simulation.cardType} />
            <Row label="Issuer" value={simulation.syntheticIssuer} />
            <Row label="Test account status" value={simulation.testAccountStatus} />
          </dl>
        </Panel>

        <Panel title="Verification results">
          <dl className="text-sm space-y-2">
            <Row label="Overall status" value={<StatusBadge status={simulation.status} />} />
            <Row label="Protocol result" value={simulation.overallResult ?? "—"} />
            <Row label="Processing duration" value={simulation.processingDurationMs ? `${simulation.processingDurationMs} ms` : "—"} mono />
            <Row label="Reference ID" value={simulation.simulationRefId?.replace(/^SIM-/, "") ?? "—"} mono />
          </dl>
        </Panel>

        <Panel title="Verification timeline">
          <div className="space-y-1.5">
            {simulation.steps.map((step: any) => (
              <div key={step.id} className="flex items-center justify-between border-b border-console-border/50 py-1.5 text-xs">
                <div>
                  <div className="data-mono text-console-text">{step.stepName}</div>
                  <div className="text-console-textFaint mt-0.5">{step.result}</div>
                </div>
                <StatusBadge status={step.status} />
              </div>
            ))}
            {simulation.steps.length === 0 && (
              <div className="text-console-textFaint text-sm py-4 text-center">Not yet run.</div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-console-textFaint">{label}</dt>
      <dd className={mono ? "data-mono text-console-text" : "text-console-text"}>{value}</dd>
    </div>
  );
}

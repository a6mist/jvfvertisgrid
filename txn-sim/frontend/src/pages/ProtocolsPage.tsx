import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { Panel } from "../components/Panel";

export function ProtocolsPage() {
  const [protocols, setProtocols] = useState<any[]>([]);
  const [label, setLabel] = useState("");

  useEffect(() => {
    api.get("/protocols").then((res) => {
      setProtocols(res.data.protocols);
      setLabel(res.data.classificationLabel);
    });
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Protocols</h1>
        <p className="text-sm text-console-textFaint mt-1">{label}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {protocols.map((p) => (
          <Link key={p.code} to={`/protocols/${p.code}`}>
            <Panel className="hover:border-accent-teal/50 transition-colors h-full">
              <div className="flex items-center justify-between mb-2">
                <div className="data-mono text-accent-teal font-semibold">{p.code}</div>
                <div className="text-[10px] text-console-textFaint">v{p.version}</div>
              </div>
              <div className="text-sm font-medium mb-1.5">{p.name}</div>
              <p className="text-xs text-console-textFaint leading-relaxed">{p.description}</p>
              {!p.active && <div className="text-[11px] text-accent-red mt-2">Inactive</div>}
            </Panel>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ProtocolDetailPage() {
  const { code } = useParams();
  const [protocol, setProtocol] = useState<any | null>(null);

  useEffect(() => {
    if (!code) return;
    api.get(`/protocols/${code}`).then((res) => setProtocol(res.data.protocol));
  }, [code]);

  if (!protocol) return <div className="text-sm text-console-textDim">Loading…</div>;

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold data-mono">{protocol.code}</h1>
          <span className="text-xs text-console-textFaint">v{protocol.version}</span>
        </div>
        <p className="text-sm text-console-text mt-1">{protocol.name}</p>
        <p className="text-xs text-accent-amber mt-2">{protocol.classificationLabel}</p>
      </div>

      <Panel title="Purpose">
        <p className="text-sm text-console-textDim leading-relaxed">{protocol.description}</p>
      </Panel>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel title="Input requirements">
          <List items={protocol.inputRequirements} mono />
        </Panel>
        <Panel title="Validation rules">
          <List items={protocol.validationRules} />
        </Panel>
        <Panel title="Simulation steps">
          <List items={protocol.simulationSteps} mono numbered />
        </Panel>
        <Panel title="Success / failure conditions">
          <div className="text-xs font-medium text-accent-teal mb-1.5">Success</div>
          <List items={protocol.successConditions} />
          <div className="text-xs font-medium text-accent-red mt-3 mb-1.5">Failure</div>
          <List items={protocol.failureConditions} />
        </Panel>
      </div>

      <Panel title="Example transaction">
        <pre className="text-xs data-mono text-console-textDim overflow-x-auto">
{JSON.stringify(
  {
    testTransactionId: "SIM-2026-000042",
    protocol: protocol.code,
    cardNetwork: "VISA",
    syntheticCardRef: "TEST-VISA-9447",
    cardType: "DEBIT",
    currency: "USD",
    amount: 250.0,
    transactionType: "PURCHASE",
    testAuthCode: "TEST-4821",
    testAccountStatus: "ACTIVE",
  },
  null,
  2
)}
        </pre>
      </Panel>
    </div>
  );
}

function List({ items, mono = false, numbered = false }: { items: string[]; mono?: boolean; numbered?: boolean }) {
  return (
    <ol className={`space-y-1.5 text-sm text-console-textDim ${numbered ? "list-decimal list-inside" : "list-disc list-inside"}`}>
      {items.map((item, i) => (
        <li key={i} className={mono ? "data-mono text-xs" : ""}>
          {item}
        </li>
      ))}
    </ol>
  );
}

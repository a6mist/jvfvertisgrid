import { FormEvent, ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { Panel } from "../components/Panel";
import { StatusBadge } from "../components/StatusBadge";

interface ProtocolOption {
  code: string;
  name: string;
  classificationLabel: string;
}

const DEFAULT_PROTOCOLS: ProtocolOption[] = ["101.1", "101.2", "101.3", "101.4", "101.5", "101.6", "201.3"].map((code) => ({ code, name: `Protocol ${code}`, classificationLabel: "" }));
const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "PHP", "SGD"];
const TRANSACTION_TYPES = ["PURCHASE", "REFUND", "AUTHORIZATION", "REVERSAL", "PREAUTH"];
const ERROR_SCENARIOS = [
  { value: "", label: "None — run normally" },
  { value: "INVALID_PROTOCOL", label: "Invalid protocol" },
  { value: "INVALID_AMOUNT", label: "Invalid amount" },
  { value: "UNSUPPORTED_CURRENCY", label: "Unsupported currency" },
  { value: "EXPIRED_TEST_REFERENCE", label: "Expired test reference" },
  { value: "INVALID_TRANSACTION_TYPE", label: "Invalid transaction type" },
  { value: "PROTOCOL_VALIDATION_FAILURE", label: "Protocol validation failure" },
  { value: "SIMULATED_NETWORK_TIMEOUT", label: "Simulated network timeout" },
  { value: "SIMULATED_PROCESSOR_UNAVAILABLE", label: "Simulated processor unavailable" },
  { value: "SIMULATED_AUTHORIZATION_FAILURE", label: "Simulated authorization failure" },
];

function randomSuffix() {
  return Math.floor(Math.random() * 900000 + 100000);
}

export function VerifyTransactionPage() {
  const navigate = useNavigate();
  const [protocols, setProtocols] = useState<ProtocolOption[]>([]);
  const [form, setForm] = useState({
    name: "",
    accountType: "Online Sale",
    testTransactionId: `SIM-2026-${randomSuffix()}`,
    protocolCode: "101.1",
    cardNetwork: "VISA",
    syntheticCardRef: "TEST-VISA-9447",
    cardType: "DEBIT",
    syntheticIssuer: "Example Bank",
    currency: "USD",
    amount: "100.00",
    transactionType: "PURCHASE",
    referenceNumber: `SIM-REF-${randomSuffix()}`,
    testAuthCode: "TEST-4821",
    testAccountStatus: "ACTIVE",
    errorScenario: "",
  });
  const [cardDetails, setCardDetails] = useState({ cardNumber: "", cvv: "", expDate: "" });
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "creating" | "running" | "done">("idle");
  const [liveSteps, setLiveSteps] = useState<any[]>([]);
  const [result, setResult] = useState<any | null>(null);

  useEffect(() => {
    api.get("/protocols").then((res) => setProtocols(DEFAULT_PROTOCOLS.map((fallback) => res.data.protocols.find((protocol: ProtocolOption) => protocol.code === fallback.code) ?? fallback))).catch(() => setProtocols(DEFAULT_PROTOCOLS));
  }, []);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function updateCardDetail(field: string, value: string) {
    setCardDetails((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLiveSteps([]);
    setPhase("creating");
    try {
      const payload = {
        ...form,
        syntheticCardRef: `TEST-${form.cardNetwork}-9447`,
        syntheticIssuer: "Local Training Dataset",
        transactionType: "PURCHASE",
        referenceNumber: `SIM-REF-${randomSuffix()}`,
        testAuthCode: "TEST-4821",
        testAccountStatus: "ACTIVE",
        amount: Number(form.amount),
        errorScenario: undefined,
      };
      const createRes = await api.post("/simulations", payload);
      const simulationId = createRes.data.simulation.id;

      setPhase("running");
      const verifyRes = await api.post(`/simulations/${simulationId}/verify`);
      const simulation = verifyRes.data.simulation;

      // Animate through the persisted steps for the demo effect.
      for (let i = 0; i < simulation.steps.length; i++) {
        await new Promise((r) => setTimeout(r, 700));
        setLiveSteps((prev) => [...prev, simulation.steps[i]]);
      }

      setResult(simulation);
      setPhase("done");
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Simulation failed to run.");
      setPhase("idle");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">DATA VERIFIED BY JVF VISA/MASTERCARD</h1>
        <p className="text-sm text-console-textFaint mt-1">
          Protocol Engine
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Transaction">
          <form onSubmit={handleSubmit} className="space-y-3">
            <Field label="Name">
              <input className={inputCls} value={form.name} onChange={(e) => update("name", e.target.value)} />
            </Field>

            <Field label="Account Type">
              <select className={inputCls} value={form.accountType} onChange={(e) => update("accountType", e.target.value)}>
                <option value="Online Sale">Online Sale</option>
                <option value="Offline Sale">Offline Sale</option>
              </select>
            </Field>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Card Number"><TestInput value={cardDetails.cardNumber} placeholder="Local only" onChange={(value) => updateCardDetail("cardNumber", value)} /></Field>
              <Field label="CVV"><TestInput value={cardDetails.cvv} placeholder="Local only" onChange={(value) => updateCardDetail("cvv", value)} /></Field>
              <Field label="Exp Date"><TestInput value={cardDetails.expDate} placeholder="Local only" onChange={(value) => updateCardDetail("expDate", value)} /></Field>
            </div>

            <Field label="Protocol">
              <select className={inputCls} value={form.protocolCode} onChange={(e) => update("protocolCode", e.target.value)}>
                {protocols.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.code}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Card Network">
                <select className={inputCls} value={form.cardNetwork} onChange={(e) => update("cardNetwork", e.target.value)}>
                  <option value="VISA">VISA</option>
                  <option value="MASTERCARD">MASTERCARD</option>
                </select>
              </Field>
              <Field label="Card Type">
                <select className={inputCls} value={form.cardType} onChange={(e) => update("cardType", e.target.value)}>
                  <option value="DEBIT">Debit</option>
                  <option value="CREDIT">Credit</option>
                  <option value="PREPAID">Prepaid</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Currency">
                <select className={inputCls} value={form.currency} onChange={(e) => update("currency", e.target.value)}>
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Amount">
                <input type="number" step="0.01" className={inputCls} value={form.amount} onChange={(e) => update("amount", e.target.value)} required />
              </Field>
            </div>

            {error && <div className="text-xs text-accent-red">{error}</div>}

            <button
              type="submit"
              disabled={phase === "creating" || phase === "running"}
              className="w-full rounded-md bg-accent-teal text-console-bg font-medium text-sm py-2.5 hover:bg-accent-teal/90 disabled:opacity-60 transition-colors"
            >
              {phase === "creating" || phase === "running" ? "Confirming…" : "Confirm"}
            </button>
          </form>
        </Panel>

        <Panel title="Verification sequence">
          {phase === "idle" && liveSteps.length === 0 && (
            <div className="text-sm text-console-textFaint py-8 text-center">
              Configure a transaction and click Confirm.
            </div>
          )}

          {(phase === "creating" || phase === "running" || phase === "done") && (
            <div className="space-y-1.5 font-mono text-xs">
              {liveSteps.map((step, i) => (
                <div key={i} className="flex items-center justify-between border-b border-console-border/50 py-1.5">
                  <span className="text-console-textDim">{step.stepName}</span>
                  <StatusBadge status={step.status} />
                </div>
              ))}
              {phase !== "done" && <div className="text-console-textFaint py-1.5 animate-pulse">Processing…</div>}
            </div>
          )}

          {result && phase === "done" && (
            <div className="mt-4 border-t border-console-border pt-4 space-y-2">
              <div className="text-sm font-semibold">
                {result.decision ?? (result.overallResult === "FAILED" ? "DENIED" : "APPROVED")}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs data-mono text-console-textDim">
                <div>Protocol: {result.protocol.code}</div>
                <div>Network: {result.cardNetwork}</div>
                <div>Result: {result.overallResult}</div>
                <div>Duration: {result.processingDurationMs} ms</div>
                <div className="col-span-2">Reference: {result.simulationRefId}</div>
              </div>
              <div className="text-xs text-console-textDim">Reason: {result.decisionReason ?? "Local checks completed."}</div>
              <div className="text-[11px] text-accent-amber pt-1">
                RESULT — THIS RESULT REPRESENT AUTHORIZATION OR VERIFICATION BY VISA,
                MASTERCARD, A BANK, OR ANY PAYMENT NETWORK.
              </div>
              <button
                onClick={() => navigate(`/transactions/${result.id}`)}
                className="mt-2 text-xs text-accent-teal hover:underline"
              >
                View full verification report →
              </button>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-md bg-console-panelAlt border border-console-border px-3 py-2 text-sm focus:border-accent-teal outline-none";

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-console-textDim mb-1.5">{label}</label>
      {children}
      {hint && <div className="text-[11px] text-console-textFaint mt-1">{hint}</div>}
    </div>
  );
}

function TestInput({ value, placeholder, onChange }: { value: string; placeholder: string; onChange: (value: string) => void }) {
  return <input type="text" className={inputCls} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} pattern="TEST-[A-Za-z0-9-]+" title="Use a TEST- value only" />;
}

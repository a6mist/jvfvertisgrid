import { FormEvent, ReactNode, useEffect, useState } from 'react';

type Phase = 'idle' | 'creating' | 'running' | 'done';
type Protocol = { code: string; name: string };
type Step = { stepName: string; status: 'SUCCESS' | 'WARNING' | 'FAILED' | 'SKIPPED' };

const defaultProtocols: Protocol[] = ['101.1', '101.2', '101.3', '101.4', '101.5', '101.6', '201.3'].map((code) => ({ code, name: `Protocol ${code}` }));
const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'PHP', 'SGD'];
const apiBase = ((import.meta as { env?: Record<string, string> }).env?.VITE_TXN_SIM_API_URL || '/api').replace(/\/$/, '');
const inputClass = 'w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm focus:border-teal-400 outline-none';

function suffix() { return Math.floor(Math.random() * 900000 + 100000); }

async function request(path: string, options?: RequestInit) {
  const token = localStorage.getItem('txnsim_token');
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options?.headers || {}) },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || (response.status === 401 ? 'Sign in to the transaction simulator first.' : 'Simulation request failed.'));
  }
  return response.json();
}

export function ProtocolsVerification() {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [form, setForm] = useState({ name: '', accountType: 'Online Sale', protocolCode: '101.1', cardNetwork: 'VISA', cardType: 'DEBIT', currency: 'USD', amount: '100.00' });
  const [cardDetails, setCardDetails] = useState({ cardNumber: '', cvv: '', expDate: '' });
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [steps, setSteps] = useState<Step[]>([]);
  const [result, setResult] = useState<any>(null);

  useEffect(() => { request('/protocols').then((data) => setProtocols(defaultProtocols.map((fallback) => data.protocols.find((protocol: Protocol) => protocol.code === fallback.code) || fallback))).catch(() => setProtocols(defaultProtocols)); }, []);
  const update = (field: string, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const updateCardDetail = (field: string, value: string) => setCardDetails((current) => ({ ...current, [field]: value }));

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(null); setResult(null); setSteps([]); setPhase('creating');
    try {
      const created = await request('/simulations', { method: 'POST', body: JSON.stringify({ ...form, testTransactionId: `SIM-2026-${suffix()}`, syntheticCardRef: `TEST-${form.cardNetwork}-9447`, syntheticIssuer: 'Local Training Dataset', transactionType: 'PURCHASE', referenceNumber: `SIM-REF-${suffix()}`, testAuthCode: 'TEST-4821', testAccountStatus: 'ACTIVE', amount: Number(form.amount) }) });
      setPhase('running');
      const verified = await request(`/simulations/${created.simulation.id}/verify`, { method: 'POST' });
      for (const step of verified.simulation.steps) { await new Promise((resolve) => setTimeout(resolve, 90)); setSteps((current) => [...current, step]); }
      setResult(verified.simulation); setPhase('done');
    } catch (e) { setError(e instanceof Error ? e.message : 'Simulation failed to run.'); setPhase('idle'); }
  }

  return <div className="min-h-screen bg-[#0B0F1A] text-white px-4 py-8 lg:px-8"><div className="max-w-6xl mx-auto space-y-6">
    <div><h1 className="text-xl font-semibold">DATA VERIFIED BY JVF VISA/MASTERCARD</h1><p className="text-sm text-white/60 mt-1">Protocol Engine</p></div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><Panel title="Transaction"><form onSubmit={submit} className="space-y-3">
      <Field label="Name"><Input value={form.name} onChange={(v) => update('name', v)} /></Field>
      <Field label="Account Type"><Select value={form.accountType} options={['Online Sale', 'Offline Sale']} onChange={(v) => update('accountType', v)} /></Field>
      <div className="grid grid-cols-3 gap-3"><Field label="Card Number"><TestInput value={cardDetails.cardNumber} placeholder="Local only" onChange={(v) => updateCardDetail('cardNumber', v)} /></Field><Field label="CVV"><TestInput value={cardDetails.cvv} placeholder="Local only" onChange={(v) => updateCardDetail('cvv', v)} /></Field><Field label="Exp Date"><TestInput value={cardDetails.expDate} placeholder="Local only" onChange={(v) => updateCardDetail('expDate', v)} /></Field></div>
      <Field label="Protocol"><Select value={form.protocolCode} options={protocols.map((p) => `${p.code} - ${p.name}`)} onChange={(v) => update('protocolCode', v.split(' - ')[0])} /></Field>
      <div className="grid grid-cols-2 gap-3"><Field label="Card Network"><Select value={form.cardNetwork} options={['VISA', 'MASTERCARD']} onChange={(v) => update('cardNetwork', v)} /></Field><Field label="Card Type"><Select value={form.cardType} options={['DEBIT', 'CREDIT', 'PREPAID']} onChange={(v) => update('cardType', v)} /></Field></div>
      <div className="grid grid-cols-2 gap-3"><Field label="Currency"><Select value={form.currency} options={currencies} onChange={(v) => update('currency', v)} /></Field><Field label="Amount"><Input type="number" value={form.amount} onChange={(v) => update('amount', v)} /></Field></div>
      {error && <div className="text-xs text-red-400">{error}</div>}
      <button type="submit" disabled={phase === 'creating' || phase === 'running'} className="w-full rounded-md bg-teal-400 text-slate-950 font-medium text-sm py-2.5 hover:bg-teal-300 disabled:opacity-60 transition-colors">{phase === 'creating' || phase === 'running' ? 'Confirming...' : 'Confirm'}</button>
    </form></Panel><Panel title="Verification sequence">
      {phase === 'idle' && steps.length === 0 && <div className="text-sm text-white/50 py-8 text-center">Configure a transaction and click Confirm.</div>}
      {phase !== 'idle' && <div className="space-y-1.5 font-mono text-xs">{steps.map((step, i) => <div key={`${step.stepName}-${i}`} className="flex items-center justify-between border-b border-white/10 py-1.5"><span className="text-white/70">{step.stepName}</span><span className={step.status === 'SUCCESS' ? 'text-teal-300' : step.status === 'WARNING' ? 'text-amber-300' : step.status === 'SKIPPED' ? 'text-white/50' : 'text-red-400'}>{step.status}</span></div>)}{phase !== 'done' && <div className="text-white/50 py-1.5 animate-pulse">Processing...</div>}</div>}
      {result && phase === 'done' && <div className="mt-4 border-t border-white/10 pt-4 space-y-2"><div className="text-sm font-semibold">SIMULATION {result.decision ?? (result.overallResult === 'FAILED' ? 'DENIED' : 'APPROVED')}</div><div className="grid grid-cols-2 gap-2 text-xs font-mono text-white/70"><div>Protocol: {result.protocol.code}</div><div>Network: {result.cardNetwork}</div><div>Result: {result.overallResult}</div><div>Duration: {result.processingDurationMs} ms</div><div className="col-span-2">Reference: {result.simulationRefId}</div></div><div className="text-xs text-white/70">Reason: {result.decisionReason ?? 'Local checks completed.'}</div><div className="text-[11px] text-amber-300 pt-1">SIMULATED RESULT - THIS RESULT DOES NOT REPRESENT AUTHORIZATION OR VERIFICATION BY ANY PAYMENT NETWORK.</div></div>}
    </Panel></div>
  </div></div>;
}

function Panel({ title, children }: { title: string; children: ReactNode }) { return <section className="rounded-lg border border-white/10 bg-white/[0.03] p-4"><h2 className="text-sm font-semibold mb-4">{title}</h2>{children}</section>; }
function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) { return <div><label className="block text-xs text-white/70 mb-1.5">{label}</label>{children}{hint && <div className="text-[11px] text-white/50 mt-1">{hint}</div>}</div>; }
function Input({ value, onChange, type = 'text' }: { value: string; onChange: (value: string) => void; type?: string }) { return <input type={type} step={type === 'number' ? '0.01' : undefined} className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} required />; }
function TestInput({ value, placeholder, onChange }: { value: string; placeholder: string; onChange: (value: string) => void }) { return <input type="text" className={inputClass} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} pattern="TEST-[A-Za-z0-9-]+" title="Use a TEST- value only" />; }
function Select({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) { return <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>; }

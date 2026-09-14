import { FormEvent, useState } from 'react';
import { Link } from 'react-router';
import { TransactionLogAuth } from '../components/TransactionLogAuth';
import { createTransactionLogEntry, hasTransactionLogSession } from '../utils/transactionLogApi';

const results = ['Success', 'Reject', 'Expired', 'Cancelled'];

type FormValues = {
  hash: string;
  date: string;
  code: string;
  amount: string;
  result: string;
};

const initialValues: FormValues = { hash: '', date: '', code: '', amount: '', result: '' };

export function TransactionInput() {
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [authenticated, setAuthenticated] = useState(hasTransactionLogSession);

  const update = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setError('');
    setSaved(false);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!values.hash || !values.date || !values.code || !values.amount || Number(values.amount) <= 0 || !results.includes(values.result)) {
      setError('Complete every field and choose a valid result.');
      return;
    }

    try {
      await createTransactionLogEntry({
        hash: values.hash.trim(),
        date: values.date,
        code: values.code.trim(),
        amount: Number(values.amount),
        result: values.result,
      });
      setValues(initialValues);
      setSaved(true);
    } catch {
      setError('This browser could not save the entry. Check storage permissions and try again.');
    }
  };

  return (
    <main className="min-h-screen bg-[#0F141B] px-4 py-8 text-[#EDEAE2] sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="border-b border-white/10 pb-7">
          <p className="font-mono text-xs uppercase tracking-wide text-[#C9A876]">JVF Platform · internal ops</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold">Transaction log</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#9BA5B0]">Manual entry for reviewed transactions.</p>
        </header>

        <nav aria-label="Transaction log pages" className="flex gap-6 border-b border-white/10">
          <Link className="border-b-2 border-[#C9A876] px-1 py-3 text-sm text-white" to="/input" aria-current="page">Input</Link>
          <Link className="px-1 py-3 text-sm text-[#9BA5B0] hover:text-white" to="/logs">Log</Link>
        </nav>

        {!authenticated && <TransactionLogAuth onAuthenticated={() => setAuthenticated(true)} />}

        {authenticated && <section className="mt-6 rounded-xl border border-white/10 bg-[#171E27] p-5 sm:p-6">
          <h2 className="font-serif text-xl font-semibold">New entry</h2>
          <p className="mt-1 text-sm text-[#6B7480]">All fields are required before the entry can be confirmed.</p>
          <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
            <label className="text-sm text-[#9BA5B0]">Transaction hash<input className="mt-2 w-full rounded-lg border border-white/15 bg-[#0F141B] px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-[#C9A876]" value={values.hash} onChange={(event) => update('hash', event.target.value)} placeholder="0x8f3a...c21d" /></label>
            <label className="text-sm text-[#9BA5B0]">Date and time<input type="datetime-local" className="mt-2 w-full rounded-lg border border-white/15 bg-[#0F141B] px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-[#C9A876]" value={values.date} onChange={(event) => update('date', event.target.value)} /></label>
            <label className="text-sm text-[#9BA5B0]">Bypass Approval code<input className="mt-2 w-full rounded-lg border border-white/15 bg-[#0F141B] px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-[#C9A876]" value={values.code} onChange={(event) => update('code', event.target.value)} placeholder="A1B2C3" /></label>
            <label className="text-sm text-[#9BA5B0]">Amount (USDT)<input type="number" min="0" step="0.01" className="mt-2 w-full rounded-lg border border-white/15 bg-[#0F141B] px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-[#C9A876]" value={values.amount} onChange={(event) => update('amount', event.target.value)} placeholder="0.00" /></label>
            <label className="text-sm text-[#9BA5B0] sm:col-span-2">Result<select className="mt-2 w-full rounded-lg border border-white/15 bg-[#0F141B] px-3 py-2.5 text-sm text-white outline-none focus:border-[#C9A876]" value={values.result} onChange={(event) => update('result', event.target.value)}><option value="">Select a result</option>{results.map((result) => <option key={result} value={result}>{result}</option>)}</select></label>
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/10 pt-4 sm:col-span-2">
              <span aria-live="polite" className="mr-auto text-sm text-[#D97C7C]">{error || (saved ? 'Entry saved.' : '')}</span>
              <button type="button" className="rounded-lg border border-white/15 px-4 py-2 text-sm text-[#9BA5B0] hover:bg-white/5" onClick={() => { setValues(initialValues); setError(''); setSaved(false); }}>Clear</button>
              <button type="submit" className="rounded-lg bg-[#C9A876] px-4 py-2 text-sm font-medium text-[#20180C] hover:opacity-90">Confirm entry</button>
            </div>
          </form>
        </section>}
      </div>
    </main>
  );
}

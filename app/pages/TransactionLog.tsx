import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { TransactionLogAuth } from '../components/TransactionLogAuth';
import { deleteTransactionLogEntry, getTransactionLogEntries, hasTransactionLogSession, TransactionLogEntry } from '../utils/transactionLogApi';

type Entry = TransactionLogEntry;

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function TransactionLog() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [search, setSearch] = useState('');
  const [authenticated, setAuthenticated] = useState(hasTransactionLogSession);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authenticated) return;
    getTransactionLogEntries()
      .then(setEntries)
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load the shared log.'));
  }, [authenticated]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? entries.filter((entry) => [entry.hash, entry.code, entry.result].some((value) => value.toLowerCase().includes(term))) : entries;
  }, [entries, search]);

  const remove = (id: string) => {
    deleteTransactionLogEntry(id)
      .then(() => setEntries((current) => current.filter((entry) => entry.id !== id)))
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to delete the entry.'));
  };

  const total = entries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

  return (
    <main className="min-h-screen bg-[#0F141B] px-4 py-8 text-[#EDEAE2] sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="border-b border-white/10 pb-7">
          <p className="font-mono text-xs uppercase tracking-wide text-[#C9A876]">JVF Platform · internal ops</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold">Transaction log</h1>
          <div className="mt-6 grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-3">
            <div className="bg-[#171E27] p-4"><p className="text-xs text-[#6B7480]">Total entries</p><p className="mt-1 font-mono text-xl">{entries.length}</p></div>
            <div className="bg-[#171E27] p-4"><p className="text-xs text-[#6B7480]">Total amount</p><p className="mt-1 font-mono text-xl">{total.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT</p></div>
            <div className="bg-[#171E27] p-4"><p className="text-xs text-[#6B7480]">Last entry</p><p className="mt-1 font-mono text-sm">{entries[0] ? formatDate(entries[0].date) : '—'}</p></div>
          </div>
        </header>

        <nav aria-label="Transaction log pages" className="flex gap-6 border-b border-white/10">
          <Link className="border-b-2 border-[#C9A876] px-1 py-3 text-sm text-white" to="/logs" aria-current="page">Log</Link>
        </nav>

        {!authenticated && <TransactionLogAuth onAuthenticated={() => setAuthenticated(true)} />}
        {error && <p role="alert" className="mt-4 text-sm text-[#D97C7C]">{error}</p>}

        {authenticated && <section className="mt-6 rounded-xl border border-white/10 bg-[#171E27] p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 className="font-serif text-xl font-semibold">Log</h2><label className="sr-only" htmlFor="transaction-search">Search transaction log</label><input id="transaction-search" className="w-full rounded-lg border border-white/15 bg-[#0F141B] px-3 py-2 font-mono text-sm text-white outline-none focus:border-[#C9A876] sm:max-w-xs" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search hash, code, or result" /></div>
          {filtered.length === 0 ? <div className="py-12 text-center text-sm text-[#6B7480]">{entries.length ? 'No matching entries.' : 'No entries yet.'}</div> : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><caption className="sr-only">Reviewed transaction entries</caption><thead className="border-b border-white/15 text-xs text-[#6B7480]"><tr><th className="px-2 py-3">#</th><th className="px-2 py-3">Transaction hash</th><th className="px-2 py-3">Date and time</th><th className="px-2 py-3">Approval code</th><th className="px-2 py-3 text-right">Amount</th><th className="px-2 py-3">Result</th><th className="px-2 py-3"><span className="sr-only">Actions</span></th></tr></thead><tbody>{filtered.map((entry, index) => <tr className="border-b border-white/10" key={entry.id}><td className="px-2 py-3 text-[#6B7480]">{filtered.length - index}</td><td className="max-w-[170px] truncate px-2 py-3 font-mono" title={entry.hash}>{entry.hash}</td><td className="whitespace-nowrap px-2 py-3 font-mono text-[#9BA5B0]">{formatDate(entry.date)}</td><td className="px-2 py-3 font-mono">{entry.code}</td><td className="px-2 py-3 text-right font-mono">{Number(entry.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT</td><td className="px-2 py-3">{entry.result}</td><td className="px-2 py-3"><button className="text-xs text-[#9BA5B0] hover:text-[#D97C7C]" onClick={() => remove(entry.id)} aria-label={`Delete transaction ${entry.hash}`}>Delete</button></td></tr>)}</tbody></table></div>}
        </section>}
      </div>
    </main>
  );
}

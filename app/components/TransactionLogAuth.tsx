import { FormEvent, useState } from 'react';
import { signInToTransactionLog } from '../utils/transactionLogApi';

export function TransactionLogAuth({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      await signInToTransactionLog(email, password);
      onAuthenticated();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to sign in.');
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="mt-6 max-w-md rounded-xl border border-white/10 bg-[#171E27] p-5">
      <h2 className="font-serif text-xl font-semibold">Sign in to view the shared log</h2>
      <p className="mt-1 text-sm text-[#9BA5B0]">Use your Render transaction-simulator account.</p>
      <form className="mt-5 space-y-4" onSubmit={submit}>
        <label className="block text-sm text-[#9BA5B0]">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-[#0F141B] px-3 py-2.5 text-white outline-none focus:border-[#C9A876]" /></label>
        <label className="block text-sm text-[#9BA5B0]">Password<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-[#0F141B] px-3 py-2.5 text-white outline-none focus:border-[#C9A876]" /></label>
        {error && <p role="alert" className="text-sm text-[#D97C7C]">{error}</p>}
        <button disabled={pending} className="rounded-lg bg-[#C9A876] px-4 py-2 text-sm font-medium text-[#20180C] disabled:opacity-60" type="submit">{pending ? 'Signing in...' : 'Sign in'}</button>
      </form>
    </section>
  );
}

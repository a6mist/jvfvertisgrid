export type TransactionLogEntry = {
  id: string;
  hash: string;
  date: string;
  code: string;
  amount: number;
  result: string;
};

const apiBase = ((import.meta as { env?: Record<string, string> }).env?.VITE_TXN_SIM_API_URL || '/api').replace(/\/$/, '');

function authorizationHeaders() {
  const token = localStorage.getItem('txnsim_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path: string, options: RequestInit = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authorizationHeaders(),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Transaction log request failed.');
  return body;
}

export function hasTransactionLogSession() {
  return Boolean(localStorage.getItem('txnsim_token'));
}

export async function signInToTransactionLog(email: string, password: string) {
  const body = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem('txnsim_token', body.token);
  localStorage.setItem('txnsim_user', JSON.stringify(body.user));
}

export async function getTransactionLogEntries() {
  const body = await request('/transaction-log');
  return body.entries as TransactionLogEntry[];
}

export async function createTransactionLogEntry(entry: Omit<TransactionLogEntry, 'id'>) {
  const body = await request('/transaction-log', {
    method: 'POST',
    body: JSON.stringify(entry),
  });
  return body.entry as TransactionLogEntry;
}

export async function deleteTransactionLogEntry(id: string) {
  await request(`/transaction-log/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

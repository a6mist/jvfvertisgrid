import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Copy, Check, ExternalLink, Trash2, Clock, CheckCircle, XCircle, Search, Filter, Loader2, RefreshCw, Wallet } from 'lucide-react';
import { getInvoices, deleteInvoice, checkExpiredInvoices, Invoice, InvoiceStatus, saveInvoice } from '../utils/invoiceStorage';
import { useIdoContract } from '../hooks/useContract';
import { isContractsConfigured } from '../config/contracts';
import { useWallet } from '../context/WalletContext';

const ALLOWED_IDO_ADMIN_WALLET = '0xEb556534041026eF6f5Fd3223cb2b3Ca7E271ec6';
const MASKED_ALLOWED_IDO_ADMIN_WALLET = '0xEb556*************************************71ec6';
const ALLOWED_IDO_ADMIN_WALLET_2 = '0x208757a4B5e89b9802A7b2a83Cf7e6DC7C2D49FE';
const MASKED_ALLOWED_IDO_ADMIN_WALLET_2 = '0x208757*************************************49FE';
const CHAIN_SYNC_TIMEOUT_MS = 15000;

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> => {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  try {
    const timeoutPromise = new Promise<T>((resolve) => {
      timeoutHandle = setTimeout(() => resolve(fallback), timeoutMs);
    });

    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
};

export function InvoiceManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [syncFilter, setSyncFilter] = useState<'all' | 'synced' | 'local'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncMap, setSyncMap] = useState<Record<string, boolean>>({});
  const { getOnChainInvoice, getInvoicePaymentTxHash, getCreatedInvoiceIds } = useIdoContract();
  const { address, connect, isConnecting } = useWallet();
  const isAllowedWallet =
    Boolean(address) &&
    [ALLOWED_IDO_ADMIN_WALLET, ALLOWED_IDO_ADMIN_WALLET_2].some(
      (wallet) => address.toLowerCase() === wallet.toLowerCase(),
    );

  useEffect(() => {
    if (!isAllowedWallet) {
      setIsLoading(false);
      return;
    }

    void loadInvoices();
  }, [isAllowedWallet]);

  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      checkExpiredInvoices();
      const localInvoices = getInvoices();

      const chainInvoiceIds = isContractsConfigured
        ? await withTimeout(getCreatedInvoiceIds(), CHAIN_SYNC_TIMEOUT_MS, [])
        : [];
      const knownIds = new Set<string>([
        ...localInvoices.map((invoice) => invoice.id),
        ...chainInvoiceIds,
      ]);

      const invoiceSeeds: Invoice[] = Array.from(knownIds).map((invoiceId) => {
        const localMatch = localInvoices.find((invoice) => invoice.id === invoiceId);
        if (localMatch) return localMatch;

        return {
          id: invoiceId,
          amount: 0,
          tokenAmount: 0,
          status: 'pending',
          createdDate: new Date().toISOString(),
          expiryDate: new Date().toISOString(),
        };
      });

      const mergedWithSync = await Promise.all(
        invoiceSeeds.map(async (localInvoice) => {
          try {
            const onChainInvoice = await withTimeout(
              getOnChainInvoice(localInvoice.id),
              CHAIN_SYNC_TIMEOUT_MS,
              null,
            );
            if (!onChainInvoice) {
              return { invoice: localInvoice, chainSynced: false };
            }

            const nowSeconds = Math.floor(Date.now() / 1000);
            const isExpired = !onChainInvoice.paid && nowSeconds > onChainInvoice.expiryDate;
            const resolvedStatus: InvoiceStatus = onChainInvoice.paid
              ? 'paid'
              : isExpired
              ? 'expired'
              : 'pending';

            const paymentTxHash = onChainInvoice.paid
              ? await withTimeout(getInvoicePaymentTxHash(localInvoice.id), CHAIN_SYNC_TIMEOUT_MS, null)
              : null;

            const merged: Invoice = {
              ...localInvoice,
              id: onChainInvoice.invoiceId || localInvoice.id,
              amount: Number(onChainInvoice.usdtAmount),
              tokenAmount: Number(onChainInvoice.tokenAmount),
              status: resolvedStatus,
              expiryDate: new Date(onChainInvoice.expiryDate * 1000).toISOString(),
              recipientWallet:
                onChainInvoice.recipientWallet !== '0x0000000000000000000000000000000000000000'
                  ? onChainInvoice.recipientWallet
                  : localInvoice.recipientWallet,
              notes: onChainInvoice.notes || localInvoice.notes,
              transactionHash: paymentTxHash || localInvoice.transactionHash,
              payer:
                onChainInvoice.payer !== '0x0000000000000000000000000000000000000000'
                  ? onChainInvoice.payer
                  : localInvoice.payer,
              paidAt: onChainInvoice.paidAt > 0
                ? new Date(onChainInvoice.paidAt * 1000).toISOString()
                : localInvoice.paidAt,
              usdtSpent: Number(onChainInvoice.usdtSpent || 0),
            };

            saveInvoice(merged);
            return { invoice: merged, chainSynced: true };
          } catch {
            return { invoice: localInvoice, chainSynced: false };
          }
        }),
      );

      const syncLookup = mergedWithSync.reduce<Record<string, boolean>>((acc, item) => {
        acc[item.invoice.id] = item.chainSynced;
        return acc;
      }, {});

      const mergedInvoices = mergedWithSync.map(item => item.invoice);

      setInvoices(
        mergedInvoices.sort((a, b) =>
          new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime(),
        ),
      );
      setSyncMap(syncLookup);
      setLastSyncedAt(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      deleteInvoice(id);
      void loadInvoices();
    }
  };

  const copyToClipboard = (invoiceId: string) => {
    const url = `${window.location.origin}/pay/${invoiceId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(invoiceId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    const styles = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      paid: 'bg-green-500/20 text-green-400 border-green-500/30',
      expired: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    
    const icons = {
      pending: Clock,
      paid: CheckCircle,
      expired: XCircle,
    };
    
    const Icon = icons[status];
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${styles[status]}`}>
        <Icon className="w-3.5 h-3.5" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         invoice.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         invoice.recipientWallet?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const isSynced = Boolean(syncMap[invoice.id]);
    const matchesSync =
      syncFilter === 'all' ||
      (syncFilter === 'synced' && isSynced) ||
      (syncFilter === 'local' && !isSynced);
    return matchesSearch && matchesStatus && matchesSync;
  });

  const stats = {
    total: invoices.length,
    pending: invoices.filter(i => i.status === 'pending').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    expired: invoices.filter(i => i.status === 'expired').length,
    totalAmount: invoices.reduce((sum, i) => i.status === 'paid' ? sum + (i.usdtSpent ?? i.amount) : sum, 0),
  };

  if (!isAllowedWallet) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Invoice Management</h1>
          <p className="text-gray-400">Monitor and manage all mission payment invoices with full transparency</p>
        </div>

        <div className={`p-4 rounded-xl border ${address ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/10'}`}>
          <p className={`text-sm font-semibold mb-1 ${address ? 'text-red-300' : 'text-white'}`}>
            {address ? 'Connecting wallet failed' : 'Wallet required'}
          </p>
          <p className={`text-sm ${address ? 'text-red-200/90' : 'text-white/70'}`}>
            Connect this wallet to access Admin Panel: {MASKED_ALLOWED_IDO_ADMIN_WALLET}
          </p>
          {!address && (
            <button
              type="button"
              onClick={connect}
              disabled={isConnecting}
              className="mt-4 px-4 py-2 rounded-lg bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Invoice Management</h1>
        <p className="text-gray-400">Monitor and manage all mission payment invoices with full transparency</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="p-4 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10">
          <div className="text-sm text-gray-400 mb-1">Total Invoices</div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="p-4 rounded-xl backdrop-blur-xl bg-yellow-500/10 border border-yellow-500/30">
          <div className="text-sm text-yellow-400 mb-1">Pending</div>
          <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
        </div>
        <div className="p-4 rounded-xl backdrop-blur-xl bg-green-500/10 border border-green-500/30">
          <div className="text-sm text-green-400 mb-1">Paid</div>
          <div className="text-2xl font-bold text-green-400">{stats.paid}</div>
        </div>
        <div className="p-4 rounded-xl backdrop-blur-xl bg-red-500/10 border border-red-500/30">
          <div className="text-sm text-red-400 mb-1">Expired</div>
          <div className="text-2xl font-bold text-red-400">{stats.expired}</div>
        </div>
        <div className="p-4 rounded-xl backdrop-blur-xl bg-gradient-to-br from-[#6C5CE7]/10 to-[#00F5D4]/10 border border-[#6C5CE7]/30">
          <div className="text-sm text-gray-400 mb-1">Total Revenue</div>
          <div className="text-2xl font-bold text-[#00F5D4]">{stats.totalAmount.toLocaleString()}</div>
          <div className="text-xs text-gray-500">USDT</div>
        </div>
      </div>

      {!isContractsConfigured && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <p className="text-sm text-red-300 font-semibold mb-1">Blockchain Sync Disabled</p>
          <p className="text-sm text-red-200/90">
            Missing VITE_IDO_CONTRACT_ADDRESS and/or VITE_USDT_CONTRACT_ADDRESS. Invoice list is showing local cache only.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by invoice ID, wallet, or notes..."
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#6C5CE7] transition-colors"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'all')}
            className="pl-12 pr-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#6C5CE7] transition-colors appearance-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={syncFilter}
            onChange={(e) => setSyncFilter(e.target.value as 'all' | 'synced' | 'local')}
            className="pl-12 pr-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#6C5CE7] transition-colors appearance-none cursor-pointer"
          >
            <option value="all">All Sync States</option>
            <option value="synced">Chain Synced</option>
            <option value="local">Local Cache</option>
          </select>
        </div>
        <button
          type="button"
          onClick={() => void loadInvoices()}
          disabled={isLoading || !isContractsConfigured}
          className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Resync All
        </button>
      </div>

      {lastSyncedAt && (
        <div className="mb-4 text-sm text-gray-400">
          Last synced: {lastSyncedAt.toLocaleString()}
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-10 h-10 text-[#6C5CE7] animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Syncing With Blockchain</h3>
            <p className="text-gray-400">Verifying invoice statuses and payment records...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Invoices Found</h3>
            <p className="text-gray-400 mb-6">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Create your first invoice to get started'}
            </p>
            <Link
              to="/admin"
              className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Create Invoice
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Invoice ID</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Amount</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Tokens</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">USDT Spent</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Paid At</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Expires</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-white font-semibold">{invoice.id}</div>
                      {invoice.notes && (
                        <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">{invoice.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white font-semibold">{invoice.amount.toLocaleString()} USDT</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[#00F5D4] font-semibold">{invoice.tokenAmount.toLocaleString()} WLG</div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(invoice.status)}
                      <div className="mt-1">
                        {syncMap[invoice.id] ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-[#00F5D4]/30 bg-[#00F5D4]/10 text-[#00F5D4] text-xs">
                            Chain Synced
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-xs">
                            Local Cache
                          </span>
                        )}
                      </div>
                      {invoice.payer && (
                        <div className="text-xs text-gray-500 mt-1 font-mono">
                          {invoice.payer.slice(0, 6)}...{invoice.payer.slice(-4)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-400">
                        {(invoice.usdtSpent ?? 0).toLocaleString()} USDT
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {invoice.paidAt ? (
                        <>
                          <div className="text-sm text-gray-400">
                            {new Date(invoice.paidAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(invoice.paidAt).toLocaleTimeString()}
                          </div>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500">Not paid</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-400">
                        {new Date(invoice.expiryDate).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(invoice.expiryDate).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/pay/${invoice.id}`}
                          target="_blank"
                          className="p-2 rounded-lg hover:bg-white/10 transition-colors group"
                          title="View Invoice"
                        >
                          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[#6C5CE7]" />
                        </Link>
                        <button
                          onClick={() => copyToClipboard(invoice.id)}
                          className="p-2 rounded-lg hover:bg-white/10 transition-colors group"
                          title="Copy Link"
                        >
                          {copiedId === invoice.id ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400 group-hover:text-[#00F5D4]" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(invoice.id)}
                          className="p-2 rounded-lg hover:bg-red-500/10 transition-colors group"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filteredInvoices.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-400">
          Showing {filteredInvoices.length} of {invoices.length} invoices
        </div>
      )}
    </div>
  );
}

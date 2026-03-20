import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Copy, Check, ExternalLink, Trash2, Clock, CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import { getInvoices, deleteInvoice, checkExpiredInvoices, Invoice, InvoiceStatus, saveInvoice } from '../utils/invoiceStorage';

export function InvoiceManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = () => {
    checkExpiredInvoices();
    const allInvoices = getInvoices();
    setInvoices(allInvoices.sort((a, b) => 
      new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
    ));
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      deleteInvoice(id);
      loadInvoices();
    }
  };

  const handleExpire = (invoice: Invoice) => {
    if (confirm('Are you sure you want to expire this invoice?')) {
      invoice.status = 'expired';
      saveInvoice(invoice);
      loadInvoices();
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
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: invoices.length,
    pending: invoices.filter(i => i.status === 'pending').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    expired: invoices.filter(i => i.status === 'expired').length,
    totalAmount: invoices.reduce((sum, i) => i.status === 'paid' ? sum + i.amount : sum, 0),
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Invoice Management</h1>
        <p className="text-gray-400">Monitor and manage all payment invoices</p>
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
      </div>

      {/* Table */}
      <div className="rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl overflow-hidden">
        {filteredInvoices.length === 0 ? (
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
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">Created</th>
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
                      <div className="text-[#00F5D4] font-semibold">{invoice.tokenAmount.toLocaleString()} WRL</div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-400">
                        {new Date(invoice.createdDate).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(invoice.createdDate).toLocaleTimeString()}
                      </div>
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
                        {invoice.status === 'pending' && (
                          <button
                            onClick={() => handleExpire(invoice)}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors group"
                            title="Expire Invoice"
                          >
                            <XCircle className="w-4 h-4 text-gray-400 group-hover:text-yellow-400" />
                          </button>
                        )}
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

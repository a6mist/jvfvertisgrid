import { useState } from 'react';
import { Copy, Check, Share2, ExternalLink } from 'lucide-react';
import { generateInvoiceId, saveInvoice, Invoice } from '../utils/invoiceStorage';
import { useIdoContract } from '../hooks/useContract';
import { toast } from 'sonner';

export function InvoiceGenerator() {
  const [amount, setAmount] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [expiryTime, setExpiryTime] = useState('');
  const [recipientWallet, setRecipientWallet] = useState('');
  const [notes, setNotes] = useState('');
  const [generatedInvoice, setGeneratedInvoice] = useState<Invoice | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createInvoice } = useIdoContract();

  const TOKEN_RATE = 100; // 1 USDT = 100 WRL tokens

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (value && !isNaN(Number(value))) {
      setTokenAmount((Number(value) * TOKEN_RATE).toString());
    } else {
      setTokenAmount('');
    }
  };

  const handleGenerateInvoice = async () => {
    if (!amount || !expiryDate || !expiryTime) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    const invoiceId = generateInvoiceId();
    const expiryDateTime = new Date(`${expiryDate}T${expiryTime}`);

    const invoice: Invoice = {
      id: invoiceId,
      amount: Number(amount),
      tokenAmount: Number(tokenAmount),
      status: 'pending',
      createdDate: new Date().toISOString(),
      expiryDate: expiryDateTime.toISOString(),
      recipientWallet: recipientWallet || undefined,
      notes: notes || undefined,
    };

    try {
      await createInvoice({
        invoiceId,
        usdtAmount: amount,
        tokenAmount,
        expiryDate: expiryDateTime.toISOString(),
        recipientWallet: recipientWallet || undefined,
        notes: notes || undefined,
      });

      saveInvoice(invoice);
      setGeneratedInvoice(invoice);

      // Reset form
      setAmount('');
      setTokenAmount('');
      setExpiryDate('');
      setExpiryTime('');
      setRecipientWallet('');
      setNotes('');
      toast.success('Invoice created on-chain successfully');
    } catch (error) {
      console.error('Create invoice failed:', error);
      toast.error('Failed to create invoice on-chain');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const invoiceUrl = generatedInvoice 
    ? `${window.location.origin}/pay/${generatedInvoice.id}`
    : '';

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Create Invoice</h1>
        <p className="text-gray-400">Generate a new payment invoice for crypto transactions</p>
      </div>

      <div className="p-8 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl mb-8">
        <div className="space-y-6">
          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Invoice Amount (USDT) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#6C5CE7] transition-colors"
            />
          </div>

          {/* Token Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Token Amount (WRL)
            </label>
            <div className="relative">
              <input
                type="number"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
                placeholder="Auto-calculated"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#6C5CE7] transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                Rate: 1 USDT = {TOKEN_RATE} WRL
              </span>
            </div>
          </div>

          {/* Expiry Date & Time */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Expiry Date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#6C5CE7] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Expiry Time <span className="text-red-400">*</span>
              </label>
              <input
                type="time"
                value={expiryTime}
                onChange={(e) => setExpiryTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#6C5CE7] transition-colors"
              />
            </div>
          </div>

          {/* Recipient Wallet */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Recipient Wallet (Optional)
            </label>
            <input
              type="text"
              value={recipientWallet}
              onChange={(e) => setRecipientWallet(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#6C5CE7] transition-colors font-mono"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Notes / Purpose (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes or payment purpose..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[#6C5CE7] transition-colors resize-none"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateInvoice}
            disabled={isSubmitting}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] text-white font-semibold hover:opacity-90 transition-opacity"
            style={{ boxShadow: '0 0 30px rgba(108, 92, 231, 0.3)' }}
          >
            {isSubmitting ? 'Submitting On-Chain...' : 'Generate Invoice'}
          </button>
        </div>
      </div>

      {/* Generated Invoice */}
      {generatedInvoice && (
        <div className="p-8 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-green-500/10 to-[#00F5D4]/10 border border-green-500/30 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <Check className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Invoice Generated Successfully!</h3>
              <p className="text-gray-400 text-sm">Share this link with your customer</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Invoice Details */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400 block mb-1">Invoice ID</span>
                  <span className="text-white font-semibold">{generatedInvoice.id}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">Amount</span>
                  <span className="text-white font-semibold">{generatedInvoice.amount} USDT</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">Tokens</span>
                  <span className="text-[#00F5D4] font-semibold">{generatedInvoice.tokenAmount} WRL</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">Expires</span>
                  <span className="text-white font-semibold">
                    {new Date(generatedInvoice.expiryDate).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Invoice URL */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <label className="text-sm text-gray-400 block mb-2">Invoice URL</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={invoiceUrl}
                  readOnly
                  className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-mono text-sm focus:outline-none"
                />
                <button
                  onClick={() => copyToClipboard(invoiceUrl)}
                  className="p-2 rounded-lg bg-[#6C5CE7] hover:bg-[#6C5CE7]/80 transition-colors"
                  title="Copy Link"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <Copy className="w-5 h-5 text-white" />
                  )}
                </button>
                <a
                  href={invoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-[#00F5D4] hover:bg-[#00F5D4]/80 transition-colors"
                  title="Open Link"
                >
                  <ExternalLink className="w-5 h-5 text-white" />
                </a>
              </div>
            </div>

            {/* Share Button */}
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `Invoice ${generatedInvoice.id}`,
                    text: `Payment invoice for ${generatedInvoice.amount} USDT`,
                    url: invoiceUrl,
                  });
                } else {
                  copyToClipboard(invoiceUrl);
                }
              }}
              className="w-full py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/15 transition-all flex items-center justify-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              Share Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

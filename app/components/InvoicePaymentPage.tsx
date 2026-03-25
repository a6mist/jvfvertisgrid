import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { Shield, ExternalLink, Wallet, Clock, CheckCircle, XCircle, Loader2, Lock, AlertTriangle, Copy, Check } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { getInvoiceById, saveInvoice, checkExpiredInvoices, Invoice } from '../utils/invoiceStorage';
import { useIdoContract } from '../hooks/useContract';
import { toast } from 'sonner';

type TransactionState = 'idle' | 'approving' | 'pending' | 'success' | 'failed';

export function InvoicePaymentPage() {
  const { invoiceId } = useParams();
  const { address, balance, isConnecting, connect, disconnect } = useWallet();
  const { stats, approveUsdt, payInvoice, getOnChainInvoice, getInvoicePaymentTxHash } = useIdoContract();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [transactionState, setTransactionState] = useState<TransactionState>('idle');
  const [transactionHash, setTransactionHash] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(true);
  const [hasAutoRedirectedToFunding, setHasAutoRedirectedToFunding] = useState(false);
  const displayUsdtBalance = Number(stats.usdtBalance || 0);
  const locale = typeof navigator !== 'undefined' ? navigator.language : 'en';
  const regionCode = locale.includes('-') ? locale.split('-')[1].toUpperCase() : '';
  const timeZone =
    typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : '';
  const timeZoneCity = timeZone.includes('/')
    ? timeZone.split('/')[timeZone.split('/').length - 1].replace(/_/g, ' ')
    : '';
  let regionName = '';
  try {
    if (regionCode && typeof Intl !== 'undefined' && 'DisplayNames' in Intl) {
      regionName = new Intl.DisplayNames([locale], { type: 'region' }).of(regionCode) || '';
    }
  } catch {
    regionName = '';
  }
  const guidanceTitle = regionName
    ? `${regionName} Payment Guide`
    : timeZoneCity
    ? `${timeZoneCity} Payment Guide`
    : 'Regional Payment Guide';
  const moonPayUrl = `https://buy.moonpay.com?currencyCode=usdt&walletAddress=${encodeURIComponent(
    address || '',
  )}&networkCode=eth`;
  const transakUrl = `https://global.transak.com?cryptoCurrencyCode=USDT&walletAddress=${encodeURIComponent(
    address || '',
  )}&network=ethereum`;

  const redirectToFunding = (provider: 'moonpay' | 'transak') => {
    const targetUrl = provider === 'moonpay' ? moonPayUrl : transakUrl;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleConnectWalletForPayment = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Connect wallet failed:', error);
      toast.error('Failed to connect wallet. Please try again.');
    }
  };

  const copyText = async (text: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Fallback below for Safari/in-app browsers that block Clipboard API.
    }

    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, text.length);
      const copiedWithExec = document.execCommand('copy');
      document.body.removeChild(textarea);
      return copiedWithExec;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const loadInvoice = async () => {
      checkExpiredInvoices();

      if (!invoiceId) {
        setInvoice(null);
        setIsLoadingInvoice(false);
        return;
      }

      const localInvoice = getInvoiceById(invoiceId);
      const onChainInvoice = await getOnChainInvoice(invoiceId);

      if (!onChainInvoice) {
        setInvoice(localInvoice);
        setIsLoadingInvoice(false);
        return;
      }

      const nowSeconds = Math.floor(Date.now() / 1000);
      const isExpired = !onChainInvoice.paid && nowSeconds > onChainInvoice.expiryDate;
      const resolvedStatus = onChainInvoice.paid ? 'paid' : isExpired ? 'expired' : 'pending';
      const logTxHash = onChainInvoice.paid
        ? await getInvoicePaymentTxHash(invoiceId)
        : null;

      const mergedInvoice: Invoice = {
        id: onChainInvoice.invoiceId || invoiceId,
        amount: Number(onChainInvoice.usdtAmount),
        tokenAmount: Number(onChainInvoice.tokenAmount),
        status: resolvedStatus,
        createdDate:
          localInvoice?.createdDate ||
          new Date(Math.max(onChainInvoice.expiryDate - 24 * 60 * 60, 0) * 1000).toISOString(),
        expiryDate: new Date(onChainInvoice.expiryDate * 1000).toISOString(),
        recipientWallet:
          onChainInvoice.recipientWallet !== '0x0000000000000000000000000000000000000000'
            ? onChainInvoice.recipientWallet
            : localInvoice?.recipientWallet,
        notes: onChainInvoice.notes || localInvoice?.notes,
        transactionHash: logTxHash || localInvoice?.transactionHash,
        payer:
          onChainInvoice.payer !== '0x0000000000000000000000000000000000000000'
            ? onChainInvoice.payer
            : localInvoice?.payer,
        paidAt:
          onChainInvoice.paidAt > 0
            ? new Date(onChainInvoice.paidAt * 1000).toISOString()
            : localInvoice?.paidAt,
        usdtSpent: Number(onChainInvoice.usdtSpent || 0),
      };

      saveInvoice(mergedInvoice);
      setInvoice(mergedInvoice);
      setIsLoadingInvoice(false);
    };

    loadInvoice();
  }, [invoiceId]);

  useEffect(() => {
    if (!invoice || invoice.status !== 'pending') return;

    const updateTimer = () => {
      const now = new Date();
      const expiry = new Date(invoice.expiryDate);
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expired');
        invoice.status = 'expired';
        saveInvoice(invoice);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [invoice]);

  useEffect(() => {
    if (!invoice || invoice.status !== 'pending' || !address || isConnecting) return;
    if (hasAutoRedirectedToFunding) return;

    const hasEnoughUsdt = displayUsdtBalance >= invoice.amount;
    if (hasEnoughUsdt) return;

    setHasAutoRedirectedToFunding(true);
    toast.info('Insufficient USDT detected. Redirecting to funding options.');
    redirectToFunding('moonpay');
  }, [address, displayUsdtBalance, hasAutoRedirectedToFunding, invoice, isConnecting]);

  const handleApprove = async () => {
    if (!invoice || !address) return;

    setTransactionState('approving');
    try {
      await approveUsdt(invoice.amount.toString());
      toast.success('USDT approval submitted');
      setTransactionState('idle');
    } catch (error) {
      console.error('Approval failed:', error);
      toast.error('Approval failed. Please try again.');
      setTransactionState('failed');
      setTimeout(() => setTransactionState('idle'), 2000);
    }
  };

  const handlePay = async () => {
    if (!invoice || !address) return;
    
    setTransactionState('pending');

    try {
      const hash = await payInvoice(invoice.id, invoice.amount.toString());
      const txHash = String(hash);

      setTransactionHash(txHash);

      invoice.status = 'paid';
      invoice.transactionHash = txHash;
      invoice.payer = address;
      invoice.paidAt = new Date().toISOString();
      invoice.usdtSpent = invoice.amount;
      saveInvoice(invoice);
      setInvoice({ ...invoice });

      toast.success('Payment confirmed on-chain');
      setTransactionState('success');
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error('Payment failed. Please try again.');
      setTransactionState('failed');
      setTimeout(() => setTransactionState('idle'), 2000);
    }
  };

  const needsApproval = invoice
    ? parseFloat(stats.usdtAllowance || '0') < invoice.amount
    : true;

  if (isLoadingInvoice) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0B0F1A' }}>
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-[#6C5CE7] animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Loading Invoice</h2>
          <p className="text-gray-400">Fetching invoice state from blockchain...</p>
        </div>
      </div>
    );
  }

  const copyToClipboard = async (text: string, type: 'hash' | 'link') => {
    const isCopied = await copyText(text);
    if (!isCopied) {
      toast.error('Copy is not supported in this browser.');
      return;
    }

    if (type === 'hash') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const getStatusBadge = (status: string) => {
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
    
    const Icon = icons[status as keyof typeof icons] || Clock;
    
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm ${styles[status as keyof typeof styles]}`}>
        <Icon className="w-4 h-4" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0B0F1A' }}>
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Invoice Not Found</h2>
          <p className="text-gray-400 mb-6">The invoice ID you're looking for doesn't exist.</p>
          <Link 
            to="/"
            className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] text-white font-semibold hover:opacity-90 transition-opacity"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pb-20"
      style={{ backgroundColor: '#0B0F1A', paddingBottom: 'max(5rem, env(safe-area-inset-bottom))' }}
    >
      {/* Header */}
      <div className="border-b border-white/10 backdrop-blur-xl bg-white/5">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link to="/" className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] bg-clip-text text-transparent">
              wearelegend
            </Link>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/30">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-xs sm:text-sm text-green-400">Blockchain Verified Payment</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                <div className="w-2 h-2 rounded-full bg-[#00F5D4] animate-pulse"></div>
                <span className="text-xs sm:text-sm text-gray-400">Ethereum Mainnet</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="border-b border-yellow-500/30 bg-yellow-500/10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-start gap-3 text-sm text-yellow-400">
            <AlertTriangle className="w-5 h-5" />
            <div className="flex-1 flex flex-wrap gap-x-6 gap-y-1">
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                All payments are processed via your wallet
              </span>
              <span className="hidden sm:inline">•</span>
              <span>We never ask for private keys or seed phrases</span>
              <span className="hidden sm:inline">•</span>
              <span>Always verify this domain before paying</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 max-w-2xl">
        {/* Invoice Card */}
        <div className="mb-8 p-4 sm:p-8 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-white mb-2 break-all">{invoice.id}</h1>
              <p className="text-gray-400">Invoice Payment</p>
            </div>
            {getStatusBadge(invoice.status)}
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center p-4 rounded-xl bg-white/5">
              <span className="text-gray-400">Amount (USDT)</span>
              <span className="text-2xl font-bold text-white">{invoice.amount.toLocaleString()} USDT</span>
            </div>
            
            <div className="flex justify-between items-center p-4 rounded-xl bg-white/5">
              <span className="text-gray-400">Token Amount</span>
              <span className="text-xl font-semibold text-[#00F5D4]">{invoice.tokenAmount.toLocaleString()} WLG</span>
            </div>

            {invoice.status === 'pending' && (
              <div className="flex justify-between items-center p-4 rounded-xl bg-white/5">
                <span className="text-gray-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Expires In
                </span>
                <span className="text-lg font-semibold text-yellow-400">{timeRemaining}</span>
              </div>
            )}

            {invoice.notes && (
              <div className="p-4 rounded-xl bg-white/5">
                <span className="text-gray-400 block mb-1">Notes</span>
                <span className="text-white">{invoice.notes}</span>
              </div>
            )}
          </div>

          {/* Share Link */}
          <div className="mb-6">
            <button
              onClick={() => void copyToClipboard(window.location.href, 'link')}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#6C5CE7]/50 transition-all group"
            >
              <span className="text-sm text-gray-400 truncate mr-2">{window.location.href}</span>
              {linkCopied ? (
                <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400 group-hover:text-[#6C5CE7] flex-shrink-0" />
              )}
            </button>
          </div>

          {invoice.status === 'pending' && (
            <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-300 mt-0.5" />
                <div className="text-sm text-blue-100/90 space-y-2">
                  <p className="font-semibold text-blue-200">{guidanceTitle}</p>
                  <p>
                    Fund your wallet first using your preferred provider available in your
                    region, then return to complete this invoice.
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-blue-100/80">
                    <li>Use USDT on Ethereum Mainnet.</li>
                    <li>Keep a small ETH balance for gas fees.</li>
                    <li>Complete two steps: Approve USDT, then Pay.</li>
                  </ul>
                  <p className="text-blue-100/70">Bank/card on-ramp availability depends on provider, country support, and account verification.</p>
                </div>
              </div>
            </div>
          )}

          {/* Wallet Connection */}
          {invoice.status === 'pending' && !address && (
            <button
              onClick={handleConnectWalletForPayment}
              disabled={isConnecting}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ boxShadow: '0 0 30px rgba(108, 92, 231, 0.3)' }}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="w-5 h-5" />
                  Connect Wallet
                </>
              )}
            </button>
          )}

          {/* Connected Wallet Info */}
          {invoice.status === 'pending' && address && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Connected Wallet</span>
                  <button
                    onClick={disconnect}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    Disconnect
                  </button>
                </div>
                <div className="text-white font-mono text-sm mb-3">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">USDT Balance</span>
                  <span className="text-lg font-semibold text-white">{displayUsdtBalance.toFixed(2)} USDT</span>
                </div>
              </div>

              {displayUsdtBalance < invoice.amount && (
                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
                  <p className="text-sm font-semibold text-orange-300 mb-1">Top-up required</p>
                  <p className="text-sm text-orange-200/90 mb-3">
                    Your connected wallet does not have enough USDT for this invoice.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => redirectToFunding('moonpay')}
                      className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm hover:bg-white/15 transition-colors"
                    >
                      Fund with MoonPay
                    </button>
                    <button
                      type="button"
                      onClick={() => redirectToFunding('transak')}
                      className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm hover:bg-white/15 transition-colors"
                    >
                      Fund with Transak
                    </button>
                  </div>
                </div>
              )}

              {/* Payment Buttons */}
              {transactionState === 'idle' && (
                <div className="space-y-3">
                  <button
                    onClick={handleApprove}
                    className="w-full py-4 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/15 transition-all"
                  >
                    1. Approve USDT
                  </button>
                  <button
                    onClick={handlePay}
                    disabled={displayUsdtBalance < invoice.amount || needsApproval}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ boxShadow: '0 0 30px rgba(108, 92, 231, 0.3)' }}
                  >
                    {displayUsdtBalance < invoice.amount ? 'Insufficient Balance' : needsApproval ? 'Approve USDT First' : '2. Pay Now'}
                  </button>
                </div>
              )}

              {/* Transaction States */}
              {transactionState === 'approving' && (
                <div className="p-6 rounded-xl bg-white/5 border border-[#6C5CE7]/30 text-center">
                  <Loader2 className="w-12 h-12 text-[#6C5CE7] animate-spin mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Waiting for Approval</h3>
                  <p className="text-gray-400">Please approve USDT spending in your wallet...</p>
                </div>
              )}

              {transactionState === 'pending' && (
                <div className="p-6 rounded-xl bg-white/5 border border-[#00F5D4]/30 text-center">
                  <Loader2 className="w-12 h-12 text-[#00F5D4] animate-spin mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Transaction Pending</h3>
                  <p className="text-gray-400">Processing your payment on the blockchain...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Success State */}
        {invoice.status === 'paid' && (
          <div className="p-8 rounded-2xl backdrop-blur-xl bg-white/5 border border-green-500/30 shadow-2xl text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Payment Successful!</h2>
            <p className="text-gray-400 mb-6">Your transaction has been confirmed on the blockchain</p>
            
            <div className="space-y-4 mb-6">
              <div className="p-4 rounded-xl bg-white/5">
                <span className="text-sm text-gray-400 block mb-1">Transaction Hash</span>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-white font-mono text-sm truncate">
                    {invoice.transactionHash}
                  </span>
                  <button
                    onClick={() => void copyToClipboard(invoice.transactionHash!, 'hash')}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
                <a
                  href={`https://etherscan.io/tx/${invoice.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-[#6C5CE7] hover:text-[#00F5D4] mt-2"
                >
                  View on Etherscan
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="p-4 rounded-xl bg-white/5">
                <span className="text-sm text-gray-400 block mb-1">Tokens Allocated</span>
                <span className="text-2xl font-bold text-[#00F5D4]">{invoice.tokenAmount.toLocaleString()} WLG</span>
              </div>
            </div>

            <Link
              to="/portfolio"
              className="block w-full py-4 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] text-white font-semibold hover:opacity-90 transition-opacity"
            >
              View Portfolio
            </Link>
          </div>
        )}

        {/* Expired State */}
        {invoice.status === 'expired' && (
          <div className="p-8 rounded-2xl backdrop-blur-xl bg-white/5 border border-red-500/30 shadow-2xl text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Invoice Expired</h2>
            <p className="text-gray-400 mb-6">This invoice has passed its expiration date and can no longer be paid.</p>
            
            <Link
              to="/"
              className="inline-block px-8 py-4 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Go Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

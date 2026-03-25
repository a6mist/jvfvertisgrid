import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { Shield, ExternalLink, Wallet, Clock, CheckCircle, XCircle, Loader2, Lock, AlertTriangle, Copy, Check, ChevronDown, Settings, RefreshCw } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { getInvoiceById, saveInvoice, checkExpiredInvoices, Invoice } from '../utils/invoiceStorage';
import { useIdoContract } from '../hooks/useContract';
import { toast } from 'sonner';
import { useAccount, useBalance } from 'wagmi';

type TransactionState = 'idle' | 'approving' | 'pending' | 'success' | 'failed';

const USDT_COMPARISON_EPSILON = 0.0001;

export function InvoicePaymentPage() {
  const { invoiceId } = useParams();
  const { address, balance, isConnecting, connect, disconnect } = useWallet();
  const { chainId } = useAccount();
  const { stats, approveUsdt, payInvoice, getOnChainInvoice, getInvoicePaymentTxHash } = useIdoContract();
  const { data: nativeBalanceData } = useBalance({
    address: (address as `0x${string}` | undefined),
    chainId: 1,
    query: { enabled: Boolean(address), refetchInterval: 5000 },
  });
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [transactionState, setTransactionState] = useState<TransactionState>('idle');
  const [transactionHash, setTransactionHash] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(true);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [allowPayDuringSync, setAllowPayDuringSync] = useState(false);
  const [transakAmount, setTransakAmount] = useState('100');
  const displayUsdtBalance = Number(stats.usdtBalance || 0);
  const rawEthBalance = nativeBalanceData ? Number(nativeBalanceData.formatted) : 0;
  const ethBalance = Number.isFinite(rawEthBalance) ? rawEthBalance : 0;
  const hasGasBalance = ethBalance > 0;
  const isWrongNetwork = Boolean(address) && chainId !== 1;
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
  const transakApiKey = import.meta.env.VITE_TRANSAK_API_KEY as string | undefined;
  const transakOtcThreshold = Number(import.meta.env.VITE_TRANSAK_OTC_THRESHOLD_USDT || 500000);
  const transakParams = new URLSearchParams({
    cryptoCurrencyCode: 'USDT',
    network: 'ethereum',
    productsAvailed: 'BUY',
    disableWalletAddressForm: 'true',
    walletAddress: address || '',
  });
  if (transakApiKey) {
    transakParams.set('apiKey', transakApiKey);
    transakParams.set('hostURL', window.location.origin);
  }
  const moonPayUrl = `https://buy.moonpay.com?currencyCode=usdt&walletAddress=${encodeURIComponent(
    address || '',
  )}&networkCode=eth`;
  const buildTransakUrl = (amount?: string) => {
    const params = new URLSearchParams(transakParams);
    const normalizedAmount = Number(amount);
    if (Number.isFinite(normalizedAmount) && normalizedAmount > 0) {
      params.set('defaultCryptoAmount', String(Math.floor(normalizedAmount)));
    }
    return `https://global.transak.com?${params.toString()}`;
  };

  const requiredTopUpAmount = Math.max(invoice ? invoice.amount - displayUsdtBalance : 0, 0);
  const normalizedTransakAmount = Math.max(Number(transakAmount || 0), 0);
  const estimatedUsdtAfterFees = normalizedTransakAmount * 0.9367;
  const transakUrl = buildTransakUrl(String(Math.floor(normalizedTransakAmount)));
  const transakFallbackUrl = 'https://transak.com/buy/usdt';
  const transakOtcUrl = 'https://transak.com/otc';
  const isHighValueInvoice = Boolean(invoice && invoice.amount >= transakOtcThreshold);

  useEffect(() => {
    if (!address || !invoice || requiredTopUpAmount <= 0) return;
    setTransakAmount(Math.ceil(requiredTopUpAmount).toString());
  }, [address, invoice?.id, requiredTopUpAmount]);

  const redirectToFunding = (
    provider: 'transak' | 'transakFallback' | 'moonpay' | 'transakOtc' = 'transak',
  ) => {
    const targetUrl =
      provider === 'transakOtc'
        ? transakOtcUrl
        : provider === 'moonpay'
        ? moonPayUrl
        : provider === 'transakFallback'
        ? transakFallbackUrl
        : transakUrl;
    const popup = window.open(targetUrl, '_blank', 'noopener,noreferrer');
    if (!popup) {
      window.location.href = targetUrl;
    }
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

  const getReadableError = (error: unknown) => {
    if (error instanceof Error && error.message.trim()) return error.message;
    if (typeof error === 'string' && error.trim()) return error;
    return 'Transaction failed. Check invoice status, allowance, balance, and network.';
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

  const handleApprove = async () => {
    if (!invoice || !address) return;
    if (isWrongNetwork) {
      toast.error('Switch wallet network to Ethereum Mainnet before approving USDT.');
      return;
    }
    if (!needsApproval) {
      toast.info('USDT is already approved. You can proceed with Pay Now.');
      return;
    }

    setTransactionState('approving');
    try {
      await approveUsdt(invoice.amount.toString());
      setAllowPayDuringSync(true);
      toast.success('USDT approval submitted');
      setTransactionState('idle');
    } catch (error) {
      console.error('Approval failed:', error);
      toast.error(getReadableError(error));
      setTransactionState('failed');
    }
  };

  const handlePay = async () => {
    if (!invoice || !address) return;
    if (isWrongNetwork) {
      toast.error('Switch wallet network to Ethereum Mainnet before paying.');
      return;
    }
    
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
      toast.error(getReadableError(error));
      setTransactionState('failed');
    }
  };

  const invoiceAmount = invoice?.amount ?? 0;
  const hasEnoughUsdtBalance = displayUsdtBalance + USDT_COMPARISON_EPSILON >= invoiceAmount;
  const currentAllowance = Number(stats.usdtAllowance || 0);
  const hasEnoughAllowance = currentAllowance + USDT_COMPARISON_EPSILON >= invoiceAmount;

  useEffect(() => {
    if (!allowPayDuringSync) return;
    if (hasEnoughAllowance) {
      setAllowPayDuringSync(false);
      return;
    }

    const timeout = window.setTimeout(() => setAllowPayDuringSync(false), 45000);
    return () => window.clearTimeout(timeout);
  }, [allowPayDuringSync, hasEnoughAllowance]);

  useEffect(() => {
    if (transactionState !== 'failed') return;
    const timeout = window.setTimeout(() => setTransactionState('idle'), 2000);
    return () => window.clearTimeout(timeout);
  }, [transactionState]);

  const needsApproval = invoice ? !hasEnoughAllowance : true;
  const canPayWithCurrentState =
    Boolean(invoice) && hasEnoughUsdtBalance && (!needsApproval || allowPayDuringSync);

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
              <button
                type="button"
                onClick={() => setIsGuideOpen((prev) => !prev)}
                className="w-full flex items-center justify-between gap-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-blue-300" />
                  <div>
                    <p className="text-sm font-semibold text-blue-200">{guidanceTitle}</p>
                    <p className="text-xs text-blue-100/70">Click to view full payment guidance</p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-blue-200 transition-transform ${isGuideOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isGuideOpen && (
                <div className="mt-3 pl-8 text-sm text-blue-100/90 space-y-2">
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
              )}
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
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-400">ETH for Gas</span>
                  <span className={`text-sm font-semibold ${hasGasBalance ? 'text-green-300' : 'text-red-300'}`}>
                    {ethBalance.toFixed(6)} ETH
                  </span>
                </div>
              </div>

              {isWrongNetwork && (
                <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                  <p className="text-sm text-yellow-200">
                    Wrong network detected. Switch your wallet to Ethereum Mainnet to continue.
                  </p>
                </div>
              )}

              {!hasEnoughUsdtBalance && (
                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
                  <button
                    type="button"
                    onClick={() => setIsTopUpOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between gap-3 text-left"
                  >
                    <div>
                      <p className="text-sm font-semibold text-orange-300">Top-up required</p>
                      <p className="text-sm text-orange-200/90">
                        Your connected wallet does not have enough USDT for this invoice.
                      </p>
                      {isHighValueInvoice && (
                        <p className="text-xs text-orange-200/90 mt-1">
                          High-value invoice detected. OTC-only funding flow is enabled.
                        </p>
                      )}
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-orange-200 transition-transform ${isTopUpOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isTopUpOpen && (
                    <div className="mt-4">
                      {isHighValueInvoice ? (
                        <div className="rounded-2xl bg-[#05070B] border border-white/10 p-4 sm:p-5 shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
                          <p className="text-sm font-semibold text-white mb-2">OTC settlement required</p>
                          <p className="text-sm text-gray-300 mb-3">
                            This invoice exceeds the retail on-ramp threshold. Use an OTC desk for
                            better execution and lower slippage.
                          </p>
                          <ul className="list-disc pl-5 text-xs text-gray-400 space-y-1 mb-4">
                            <li>Request a firm quote from your OTC provider.</li>
                            <li>Settle USDT to your wallet on Ethereum Mainnet.</li>
                            <li>Return here to complete Approve and Pay.</li>
                          </ul>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              type="button"
                              onClick={() => redirectToFunding('transakOtc')}
                              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                            >
                              Open Transak OTC
                            </button>
                            <button
                              type="button"
                              onClick={() => redirectToFunding('transakFallback')}
                              className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm hover:bg-white/15 transition-colors"
                            >
                              View Funding Alternatives
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="mb-4 max-w-md mx-auto rounded-3xl bg-[#05070B] border border-white/10 p-4 sm:p-5 shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
                            <div className="flex items-center justify-between mb-5">
                              <button
                                type="button"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-white"
                              >
                                USD
                                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                              </button>
                              <div className="flex items-center gap-2 text-white">
                                <span className="text-sm font-semibold">Buy USDT</span>
                              </div>
                              <button
                                type="button"
                                className="p-2 rounded-full bg-white/5 border border-white/10 text-gray-300"
                                aria-label="Transak settings"
                              >
                                <Settings className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="text-center mb-4">
                              <div className="relative inline-flex items-center">
                                <span className="text-3xl sm:text-4xl font-semibold text-gray-500 mr-1">$</span>
                                <input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={transakAmount}
                                  onChange={(event) => setTransakAmount(event.target.value)}
                                  className="w-36 sm:w-44 bg-transparent text-center text-4xl sm:text-5xl font-bold text-white tracking-tight focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </div>
                              <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-gray-400">
                                <RefreshCw className="w-3 h-3" />
                                <span>{estimatedUsdtAfterFees.toFixed(2)} USDT</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-4 gap-2 mb-4">
                              {[100, 250, 500, 1000].map((amountOption) => (
                                <button
                                  key={amountOption}
                                  type="button"
                                  onClick={() => setTransakAmount(amountOption.toString())}
                                  className="px-2 py-1.5 rounded-full bg-[#2B2F36] border border-white/10 text-xs font-semibold text-white hover:bg-[#3A3F48] transition-colors"
                                >
                                  ${amountOption}
                                </button>
                              ))}
                            </div>

                            <button
                              type="button"
                              onClick={() => redirectToFunding('transak')}
                              className="w-full py-3 rounded-full bg-gradient-to-r from-[#8A00FF] to-[#6200EA] text-white font-semibold hover:opacity-95 transition-opacity"
                            >
                              Continue with Tether
                            </button>

                            <p className="text-[11px] text-center text-gray-500 mt-2">Powered by Transak</p>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              type="button"
                              onClick={() => redirectToFunding('moonpay')}
                              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                            >
                              Fund with MoonPay
                            </button>
                            <button
                              type="button"
                              onClick={() => redirectToFunding('transakOtc')}
                              className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm hover:bg-white/15 transition-colors"
                            >
                              Use Transak OTC
                            </button>
                            <button
                              type="button"
                              onClick={() => redirectToFunding('transak')}
                              className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm hover:bg-white/15 transition-colors"
                            >
                              Fund with Transak
                            </button>
                            <button
                              type="button"
                              onClick={() => redirectToFunding('transakFallback')}
                              className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm hover:bg-white/15 transition-colors"
                            >
                              Open Transak Buy Page
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Payment Buttons */}
              {(transactionState === 'idle' || transactionState === 'failed') && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => void handleApprove()}
                    disabled={transactionState !== 'idle' || isWrongNetwork || !needsApproval}
                    className="w-full py-4 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/15 transition-all"
                  >
                    {needsApproval ? '1. Approve USDT' : '1. Approved'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handlePay()}
                    disabled={
                      transactionState !== 'idle' ||
                      isWrongNetwork ||
                      !canPayWithCurrentState
                    }
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ boxShadow: '0 0 30px rgba(108, 92, 231, 0.3)' }}
                  >
                    {!hasEnoughUsdtBalance
                      ? 'Insufficient Balance'
                      : needsApproval && allowPayDuringSync
                      ? 'Allowance syncing... Tap Pay'
                      : needsApproval
                      ? 'Approve USDT First'
                      : '2. Pay Now'}
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

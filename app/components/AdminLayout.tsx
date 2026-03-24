import { Link, Outlet, useLocation } from 'react-router';
import { FileText, LayoutDashboard, Home, Wallet } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { toast } from 'sonner';

const ALLOWED_IDO_ADMIN_WALLET = '0xEb556534041026eF6f5Fd3223cb2b3Ca7E271ec6';
const MASKED_ALLOWED_IDO_ADMIN_WALLET = '0xEb556*************************************71ec6';
const ALLOWED_IDO_ADMIN_WALLET_2 = '0x208757a4B5e89b9802A7b2a83Cf7e6DC7C2D49FE';
const MASKED_ALLOWED_IDO_ADMIN_WALLET_2 = '0x208757*************************************49FE';

export function AdminLayout() {
  const location = useLocation();
  const { address, isConnected } = useAccount();
  const { connectors, connectAsync, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const hasShownUnauthorizedToast = useRef(false);

  const isAllowedWallet =
    Boolean(address) &&
    [ALLOWED_IDO_ADMIN_WALLET, ALLOWED_IDO_ADMIN_WALLET_2].some(
      (wallet) => address.toLowerCase() === wallet.toLowerCase(),
    );
  const isUnauthorizedConnected = Boolean(isConnected && address && !isAllowedWallet);
  const hasAdminAccess = Boolean(isConnected && isAllowedWallet);
  const walletLabel = isAllowedWallet && address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect Wallet';

  useEffect(() => {
    if (isUnauthorizedConnected) {
      disconnect();
      if (!hasShownUnauthorizedToast.current) {
        toast.error('Connecting wallet failed');
        hasShownUnauthorizedToast.current = true;
      }
      return;
    }

    hasShownUnauthorizedToast.current = false;
  }, [disconnect, isUnauthorizedConnected]);

  const handleWalletClick = async () => {
    if (isConnected) {
      if (!isAllowedWallet) {
        disconnect();
        toast.error('Connecting wallet failed');
        return;
      }

      disconnect();
      return;
    }

    if (connectors.length === 0) return;

    try {
      const result = await connectAsync({ connector: connectors[0] });
      const connectedAddress = result.accounts?.[0];

      if (
        !connectedAddress ||
        ![ALLOWED_IDO_ADMIN_WALLET, ALLOWED_IDO_ADMIN_WALLET_2].some(
          (wallet) => connectedAddress.toLowerCase() === wallet.toLowerCase(),
        )
      ) {
        disconnect();
        toast.error('Connecting wallet failed');
      }
    } catch {
      toast.error('Connecting wallet failed');
    }
  };
  
  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0B0F1A' }}>
      {/* Header */}
      <div className="border-b border-white/10 backdrop-blur-xl bg-white/5">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-3xl font-bold bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] bg-clip-text text-transparent">
              wearelegend
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={handleWalletClick}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] text-white hover:opacity-90 transition-all disabled:opacity-60 flex items-center gap-2"
              >
                <Wallet className="w-4 h-4" />
                <span className="text-sm">{isPending ? 'Connecting...' : walletLabel}</span>
              </button>
              <span className="px-4 py-2 rounded-xl bg-[#6C5CE7]/20 text-[#6C5CE7] text-sm font-semibold border border-[#6C5CE7]/30">
                Admin Panel
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b border-white/10 bg-white/5">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            <Link
              to="/"
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                location.pathname === '/'
                  ? 'border-[#6C5CE7] text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Home className="w-4 h-4" />
              Home
            </Link>
            <Link
              to="/admin"
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                isActive('/admin') && location.pathname === '/admin'
                  ? 'border-[#6C5CE7] text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              Create Invoice
            </Link>
            <Link
              to="/admin/invoices"
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                isActive('/admin/invoices')
                  ? 'border-[#6C5CE7] text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Manage Invoices
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        {!hasAdminAccess ? (
          <div
            className={`max-w-2xl mx-auto p-6 rounded-2xl border text-center ${
              isUnauthorizedConnected
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-white/5 border-white/10'
            }`}
          >
            <h2
              className={`text-2xl font-semibold mb-2 ${
                isUnauthorizedConnected ? 'text-red-300' : 'text-white'
              }`}
            >
              {isUnauthorizedConnected ? 'Connecting wallet failed' : 'Wallet required'}
            </h2>
            <p className={`text-sm ${isUnauthorizedConnected ? 'text-red-200/90' : 'text-white/70'}`}>
              Connect this wallet to access Admin Panel: {MASKED_ALLOWED_IDO_ADMIN_WALLET} or {MASKED_ALLOWED_IDO_ADMIN_WALLET_2}
            </p>
          </div>
        ) : (
          <Outlet />
        )}
      </div>
    </div>
  );
}

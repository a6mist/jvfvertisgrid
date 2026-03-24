import { Outlet, NavLink } from "react-router";
import { LayoutDashboard, Settings, Wallet, FileText, Menu, X, FilePlus2, ReceiptText } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { toast } from "sonner";

const ALLOWED_IDO_ADMIN_WALLET = "0xEb556534041026eF6f5Fd3223cb2b3Ca7E271ec6";
const MASKED_ALLOWED_IDO_ADMIN_WALLET = "0xEb556*************************************71ec6";
const ALLOWED_IDO_ADMIN_WALLET_2 = "0x208757a4B5e89b9802A7b2a83Cf7e6DC7C2D49FE";
const MASKED_ALLOWED_IDO_ADMIN_WALLET_2 = "0x208757*************************************49FE";

export function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const walletLabel = isAllowedWallet && address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connect Wallet";

  const getPreferredConnector = () => {
    const readyConnectors = connectors.filter((connector) => connector.ready ?? true);
    if (readyConnectors.length === 0) return null;

    const metaMask = readyConnectors.find((connector) => {
      const normalized = `${connector.id} ${connector.name}`.toLowerCase();
      return normalized.includes("meta");
    });

    return metaMask ?? readyConnectors[0];
  };

  useEffect(() => {
    if (isUnauthorizedConnected) {
      disconnect();
      if (!hasShownUnauthorizedToast.current) {
        toast.error("Connecting wallet failed");
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
        toast.error("Connecting wallet failed");
        return;
      }

      disconnect();
      return;
    }

    const connector = getPreferredConnector();
    if (!connector) {
      toast.error("No wallet connector available");
      return;
    }

    try {
      const result = await connectAsync({ connector });
      const connectedAddress = result.accounts?.[0];

      if (
        !connectedAddress ||
        ![ALLOWED_IDO_ADMIN_WALLET, ALLOWED_IDO_ADMIN_WALLET_2].some(
          (wallet) => connectedAddress.toLowerCase() === wallet.toLowerCase(),
        )
      ) {
        disconnect();
        toast.error("Connecting wallet failed");
      }
    } catch {
      toast.error("Connecting wallet failed");
    }
  };

  const navItems = [
    { to: "/ido-admin", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/ido-admin/controls", icon: Settings, label: "Controls" },
    { to: "/ido-admin/treasury", icon: Wallet, label: "Treasury" },
    { to: "/ido-admin/logs", icon: FileText, label: "Logs" },
    { to: "/admin", icon: FilePlus2, label: "Create Invoice" },
    { to: "/admin/invoices", icon: ReceiptText, label: "Manage Invoices" },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F1A]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl bg-[#0B0F1A]/80">
        <div className="flex items-center justify-between px-4 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="wearelegend"
              className="w-10 h-10 rounded-xl object-cover"
            />
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] bg-clip-text text-transparent">
                wearelegend
              </h1>
              <p className="text-xs text-white/60">IDO Admin Panel</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                  end={item.to === "/ido-admin"}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                    isActive
                      ? "bg-[#6C5CE7]/20 text-[#6C5CE7] shadow-[0_0_20px_rgba(108,92,231,0.3)]"
                      : "text-white/70 hover:text-white hover:bg-white/5"
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Wallet Connect Button */}
          <button
            onClick={handleWalletClick}
            disabled={isPending}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] text-white hover:shadow-[0_0_30px_rgba(108,92,231,0.5)] transition-all disabled:opacity-60"
          >
            <Wallet className="w-4 h-4" />
            <span className="hidden lg:inline">{isPending ? "Connecting..." : walletLabel}</span>
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/5 text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/10 bg-[#0B0F1A]/95 backdrop-blur-xl overflow-hidden"
            >
              <div className="p-4 space-y-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/ido-admin"}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isActive
                          ? "bg-[#6C5CE7]/20 text-[#6C5CE7] shadow-[0_0_20px_rgba(108,92,231,0.3)]"
                          : "text-white/70 hover:text-white hover:bg-white/5"
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
                <button
                  onClick={handleWalletClick}
                  disabled={isPending}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] text-white w-full disabled:opacity-60"
                >
                  <Wallet className="w-5 h-5" />
                  <span>{isPending ? "Connecting..." : walletLabel}</span>
                </button>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 lg:px-8">
        {!hasAdminAccess ? (
          <div
            className={`max-w-2xl mx-auto p-6 rounded-2xl border text-center ${
              isUnauthorizedConnected
                ? "bg-red-500/10 border-red-500/30"
                : "bg-white/5 border-white/10"
            }`}
          >
            <h2
              className={`text-2xl font-semibold mb-2 ${
                isUnauthorizedConnected ? "text-red-300" : "text-white"
              }`}
            >
              {isUnauthorizedConnected ? "Connecting wallet failed" : "Wallet required"}
            </h2>
            <p className={`text-sm ${isUnauthorizedConnected ? "text-red-200/90" : "text-white/70"}`}>
              Connect this wallet to access IDO Admin: {MASKED_ALLOWED_IDO_ADMIN_WALLET} or {MASKED_ALLOWED_IDO_ADMIN_WALLET_2}
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Outlet />
          </motion.div>
        )}
      </main>
    </div>
  );
}
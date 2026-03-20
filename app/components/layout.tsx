import { Outlet, NavLink } from "react-router";
import { LayoutDashboard, Settings, Wallet, FileText, Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

export function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { address, isConnected } = useAccount();
  const { connectors, connectAsync, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const walletLabel = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connect Wallet";

  const handleWalletClick = async () => {
    if (isConnected) {
      disconnect();
      return;
    }

    if (connectors.length === 0) return;
    await connectAsync({ connector: connectors[0] });
  };

  const navItems = [
    { to: "/ido-admin", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/ido-admin/controls", icon: Settings, label: "Controls" },
    { to: "/ido-admin/treasury", icon: Wallet, label: "Treasury" },
    { to: "/ido-admin/logs", icon: FileText, label: "Logs" },
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
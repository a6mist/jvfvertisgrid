import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useAccount } from 'wagmi';
import { WalletModal } from './WalletModal';
import { Wallet, Menu, X } from 'lucide-react';

export const Navbar = () => {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { address, isConnected } = useAccount();
  const location = useLocation();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/buy', label: 'Buy Tokens' },
    { path: '/portfolio', label: 'Portfolio' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="wearelegend"
                className="w-10 h-10 rounded-xl object-cover"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] bg-clip-text text-transparent">
                wearelegend
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`
                    px-4 py-2 rounded-lg transition-all
                    ${
                      isActive(link.path)
                        ? 'bg-gradient-to-r from-[#6C5CE7]/20 to-[#00F5D4]/20 text-[#00F5D4] border border-[#6C5CE7]/50'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Wallet Button */}
            <div className="hidden md:block">
              <button
                onClick={() => setIsWalletModalOpen(true)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] hover:shadow-[0_0_30px_rgba(108,92,231,0.5)] transition-all flex items-center gap-2 font-semibold"
              >
                <Wallet className="w-5 h-5" />
                {isConnected ? formatAddress(address!) : 'Connect Wallet'}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/5"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-white/10">
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      px-4 py-2 rounded-lg transition-all
                      ${
                        isActive(link.path)
                          ? 'bg-gradient-to-r from-[#6C5CE7]/20 to-[#00F5D4]/20 text-[#00F5D4] border border-[#6C5CE7]/50'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    {link.label}
                  </Link>
                ))}
                <button
                  onClick={() => {
                    setIsWalletModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] hover:shadow-[0_0_30px_rgba(108,92,231,0.5)] transition-all flex items-center gap-2 font-semibold justify-center mt-2"
                >
                  <Wallet className="w-5 h-5" />
                  {isConnected ? formatAddress(address!) : 'Connect Wallet'}
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <WalletModal isOpen={isWalletModalOpen} onClose={() => setIsWalletModalOpen(false)} />
    </>
  );
};

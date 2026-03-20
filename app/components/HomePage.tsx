import { Link } from 'react-router';
import { Wallet, FileText, LayoutDashboard } from 'lucide-react';

export function HomePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0B0F1A' }}>
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] bg-clip-text text-transparent">
            wearelegend
          </h1>
          <p className="text-xl text-gray-400">Web3 Invoice & Payment Gateway</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Link 
            to="/admin/invoices"
            className="group p-8 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 hover:border-[#6C5CE7]/50 transition-all hover:shadow-lg hover:shadow-[#6C5CE7]/20"
          >
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#6C5CE7] to-[#00F5D4] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Pay Invoice</h2>
            <p className="text-gray-400">Open a generated payment link from invoice records</p>
          </Link>

          <Link 
            to="/admin"
            className="group p-8 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 hover:border-[#00F5D4]/50 transition-all hover:shadow-lg hover:shadow-[#00F5D4]/20"
          >
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#00F5D4] to-[#6C5CE7] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Admin Panel</h2>
            <p className="text-gray-400">Create and manage invoices</p>
          </Link>

          <Link 
            to="/admin/invoices"
            className="group p-8 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 hover:border-[#6C5CE7]/50 transition-all hover:shadow-lg hover:shadow-[#6C5CE7]/20"
          >
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#6C5CE7] to-[#00F5D4] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <LayoutDashboard className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Dashboard</h2>
            <p className="text-gray-400">View all invoices and analytics</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

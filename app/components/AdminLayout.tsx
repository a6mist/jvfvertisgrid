import { Link, Outlet, useLocation } from 'react-router';
import { FileText, LayoutDashboard, Home } from 'lucide-react';

export function AdminLayout() {
  const location = useLocation();
  
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
        <Outlet />
      </div>
    </div>
  );
}

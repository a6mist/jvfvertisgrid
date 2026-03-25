import { Outlet } from 'react-router';
import { Navbar } from './components/Navbar';
import { Toaster } from 'sonner';

export const Root = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <Navbar />
      <main className="pt-[calc(4rem+env(safe-area-inset-top))]">
        <Outlet />
      </main>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1a2e',
            color: '#fff',
            border: '1px solid #6C5CE7',
          },
        }}
      />
    </div>
  );
};

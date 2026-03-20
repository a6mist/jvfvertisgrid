import { Outlet } from 'react-router';
import { Navbar } from './components/Navbar';
import { Toaster } from 'sonner';

export const Root = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />
      <main className="pt-16">
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

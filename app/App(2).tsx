import { RouterProvider } from 'react-router';
import { router } from './routes';
import { WalletProvider } from './context/WalletContext';
import { useEffect } from 'react';
import { initializeSampleInvoices } from './utils/invoiceStorage';

export default function App() {
  useEffect(() => {
    initializeSampleInvoices();
  }, []);

  return (
    <WalletProvider>
      <RouterProvider router={router} />
    </WalletProvider>
  );
}
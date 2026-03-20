import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { config } from './config/wagmi';
import { router } from './routes';
import { WalletProvider } from './context/WalletContext';

const queryClient = new QueryClient();

export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletProvider>
          <RouterProvider router={router} />
        </WalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

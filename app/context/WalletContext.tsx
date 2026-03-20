import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useAccount, useBalance, useConnect, useDisconnect } from 'wagmi';
import { formatUnits } from 'viem';
import { USDT_CONTRACT_ADDRESS, isContractsConfigured } from '../config/contracts';

interface WalletContextType {
  address: string | null;
  balance: number;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const { connectors, connectAsync, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const { data: usdtBalanceData } = useBalance({
    address,
    token: USDT_CONTRACT_ADDRESS,
    query: { enabled: Boolean(address) && isContractsConfigured },
  });

  const balance = useMemo(() => {
    if (!usdtBalanceData) return 0;
    return Number(formatUnits(usdtBalanceData.value, usdtBalanceData.decimals));
  }, [usdtBalanceData]);

  const connect = async () => {
    if (isConnected || connectors.length === 0) return;
    await connectAsync({ connector: connectors[0] });
  };

  const handleDisconnect = () => disconnect();

  return (
    <WalletContext.Provider
      value={{
        address: address ?? null,
        balance,
        isConnecting: isPending,
        connect,
        disconnect: handleDisconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}

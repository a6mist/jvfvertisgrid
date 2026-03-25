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

const PREFERRED_CONNECTOR_STORAGE_KEY = 'wlg_preferred_connector_id';

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const { connectors, connectAsync, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const getPreferredConnector = () => {
    const readyConnectors = connectors.filter((connector) => connector.ready ?? true);
    if (readyConnectors.length === 0) return null;

    const preferredConnectorId =
      typeof window !== 'undefined'
        ? window.localStorage.getItem(PREFERRED_CONNECTOR_STORAGE_KEY)
        : null;
    if (preferredConnectorId) {
      const preferredConnector = readyConnectors.find(
        (connector) => connector.id === preferredConnectorId,
      );
      if (preferredConnector) return preferredConnector;
    }

    const isMobileClient =
      typeof navigator !== 'undefined' && /android|iphone|ipad|ipod/i.test(navigator.userAgent);

    if (isMobileClient) {
      const walletConnect = readyConnectors.find((connector) => {
        const normalized = `${connector.id} ${connector.name}`.toLowerCase();
        return normalized.includes('walletconnect');
      });
      if (walletConnect) return walletConnect;
    }

    const metaMask = readyConnectors.find((connector) => {
      const normalized = `${connector.id} ${connector.name}`.toLowerCase();
      return normalized.includes('meta');
    });

    return metaMask ?? readyConnectors[0];
  };

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
    if (isConnected) return;

    const connector = getPreferredConnector();
    if (!connector) {
      throw new Error('No wallet connector available. Install MetaMask or use WalletConnect.');
    }

    await connectAsync({ connector });

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(PREFERRED_CONNECTOR_STORAGE_KEY, connector.id);
    }
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

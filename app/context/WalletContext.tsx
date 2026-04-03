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

  const isMobileClient =
    typeof navigator !== 'undefined' && /android|iphone|ipad|ipod/i.test(navigator.userAgent);

  const isMetaMaskInAppBrowser =
    typeof navigator !== 'undefined' && /metamask/i.test(navigator.userAgent);

  const getWalletConnectConnector = () => {
    const readyConnectors = connectors.filter((connector) => connector.ready ?? true);
    return readyConnectors.find((connector) => {
      const normalized = `${connector.id} ${connector.name}`.toLowerCase();
      return normalized.includes('walletconnect');
    });
  };

  const getMetaMaskConnector = () => {
    const readyConnectors = connectors.filter((connector) => connector.ready ?? true);
    return readyConnectors.find((connector) => {
      const normalized = `${connector.id} ${connector.name}`.toLowerCase();
      return normalized.includes('meta');
    });
  };

  const getPreferredConnector = () => {
    const readyConnectors = connectors.filter((connector) => connector.ready ?? true);
    if (readyConnectors.length === 0) return null;

    // Mobile Safari should prioritize WalletConnect. MetaMask in-app browser can use injected.
    if (isMobileClient && !isMetaMaskInAppBrowser) {
      const walletConnect = getWalletConnectConnector();
      if (walletConnect) return walletConnect;
    }

    if (isMetaMaskInAppBrowser) {
      const metaMask = getMetaMaskConnector();
      if (metaMask) return metaMask;
    }

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

    const walletConnect = getWalletConnectConnector();
    if (walletConnect) return walletConnect;

    const metaMask = getMetaMaskConnector();

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

    const primaryConnector = getPreferredConnector();
    if (!primaryConnector) {
      throw new Error('No wallet connector available. Install MetaMask or use WalletConnect.');
    }

    const fallbackQueue = [
      primaryConnector,
      getWalletConnectConnector(),
      getMetaMaskConnector(),
      ...connectors.filter((connector) => connector.ready ?? true),
    ].filter((connector, index, arr): connector is NonNullable<typeof connector> => {
      if (!connector) return false;
      return arr.findIndex((candidate) => candidate?.id === connector.id) === index;
    });

    let lastError: unknown;
    for (const connector of fallbackQueue) {
      try {
        await connectAsync({ connector });

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(PREFERRED_CONNECTOR_STORAGE_KEY, connector.id);
        }

        return;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('Failed to connect wallet. Please try WalletConnect or MetaMask app browser.');
  };

  const handleDisconnect = () => {
    disconnect();
  };

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

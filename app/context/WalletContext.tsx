import { createContext, useContext, ReactNode, useEffect, useMemo, useState } from 'react';
import { useAccount, useBalance, useConnect, useDisconnect } from 'wagmi';
import { formatUnits } from 'viem';
import { USDT_CONTRACT_ADDRESS, isContractsConfigured } from '../config/contracts';
import { isTronMode } from '../config/network';

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
  const [tronAddress, setTronAddress] = useState<string | null>(null);
  const [tronBalance, setTronBalance] = useState(0);
  const [isTronConnecting, setIsTronConnecting] = useState(false);

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
    query: { enabled: !isTronMode && Boolean(address) && isContractsConfigured },
  });

  useEffect(() => {
    if (!isTronMode) return;

    let isMounted = true;

    const syncTronState = async () => {
      const tronWeb = (window as any)?.tronWeb;
      const connectedAddress = tronWeb?.defaultAddress?.base58;

      if (!connectedAddress) {
        if (!isMounted) return;
        setTronAddress(null);
        setTronBalance(0);
        return;
      }

      if (!isMounted) return;
      setTronAddress(connectedAddress);

      try {
        const balanceInSun = await tronWeb.trx.getBalance(connectedAddress);
        if (!isMounted) return;
        setTronBalance(Number(balanceInSun || 0) / 1_000_000);
      } catch {
        if (!isMounted) return;
        setTronBalance(0);
      }
    };

    void syncTronState();
    const timer = window.setInterval(() => {
      void syncTronState();
    }, 4000);

    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const balance = useMemo(() => {
    if (isTronMode) return tronBalance;
    if (!usdtBalanceData) return 0;
    return Number(formatUnits(usdtBalanceData.value, usdtBalanceData.decimals));
  }, [tronBalance, usdtBalanceData]);

  const connect = async () => {
    if (isTronMode) {
      setIsTronConnecting(true);
      try {
        const tronLink = (window as any)?.tronLink;
        const tronWeb = (window as any)?.tronWeb;

        if (!tronLink && !tronWeb) {
          throw new Error('TronLink wallet not detected. Install TronLink to continue.');
        }

        if (tronLink?.request) {
          await tronLink.request({ method: 'tron_requestAccounts' });
        }

        const connectedAddress = (window as any)?.tronWeb?.defaultAddress?.base58;
        if (!connectedAddress) {
          throw new Error('Unable to read TronLink address. Open TronLink and approve this site.');
        }

        setTronAddress(connectedAddress);
        return;
      } finally {
        setIsTronConnecting(false);
      }
    }

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
    if (isTronMode) {
      setTronAddress(null);
      setTronBalance(0);
      return;
    }

    disconnect();
  };

  return (
    <WalletContext.Provider
      value={{
        address: isTronMode ? tronAddress : address ?? null,
        balance,
        isConnecting: isTronMode ? isTronConnecting : isPending,
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

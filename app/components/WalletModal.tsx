import { useMemo, useState } from 'react';
import { useConnect, useAccount, useDisconnect } from 'wagmi';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Wallet, Copy, LogOut, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const walletInfo = {
  metamask: {
    name: 'MetaMask',
    icon: '🦊',
    description: 'Browser extension & mobile',
  },
  walletConnect: {
    name: 'WalletConnect',
    icon: '🔗',
    description: 'Mobile wallets via QR',
  },
  coinbaseWallet: {
    name: 'Coinbase Wallet',
    icon: '🔵',
    description: 'Coinbase wallet app',
  },
};

type WalletInfo = {
  name: string;
  icon: string;
  description: string;
};

type MappedConnector = {
  key: string;
  connector: ReturnType<typeof useConnect>['connectors'][number];
  info: WalletInfo;
};

const getConnectorKey = (id: string, name: string) => {
  const normalized = `${id} ${name}`.toLowerCase();

  if (normalized.includes('meta') || normalized.includes('injected')) return 'metamask';
  if (normalized.includes('walletconnect')) return 'walletConnect';
  if (normalized.includes('coinbase')) return 'coinbaseWallet';

  return `${id}:${name}`;
};

const getConnectorInfo = (key: string, connectorName: string): WalletInfo => {
  const mapped = walletInfo[key as keyof typeof walletInfo];
  if (mapped) return mapped;

  return {
    name: connectorName,
    icon: '💼',
    description: 'Crypto wallet',
  };
};

export const WalletModal = ({ isOpen, onClose }: WalletModalProps) => {
  const { connectors, connectAsync, isPending } = useConnect();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);
  const [activeConnectorKey, setActiveConnectorKey] = useState<string | null>(null);

  const uniqueConnectors = useMemo<MappedConnector[]>(() => {
    const seen = new Set<string>();
    const unique: MappedConnector[] = [];

    connectors.forEach((connector) => {
      const key = getConnectorKey(connector.id, connector.name);
      if (seen.has(key)) return;
      seen.add(key);

      unique.push({
        key,
        connector,
        info: getConnectorInfo(key, connector.name),
      });
    });

    return unique;
  }, [connectors]);

  const handleConnect = async (mapped: MappedConnector) => {
    setActiveConnectorKey(mapped.key);
    try {
      await connectAsync({ connector: mapped.connector });
      toast.success('Wallet connected successfully!');
      onClose();
    } catch (error) {
      console.error('Connection failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to connect wallet';
      toast.error(message);
    } finally {
      setActiveConnectorKey(null);
    }
  };

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast.info('Wallet disconnected');
    onClose();
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#0a0a0f]/95 backdrop-blur-xl border-[#6C5CE7]/30">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-[#6C5CE7] to-[#00F5D4] bg-clip-text text-transparent">
            {isConnected ? 'Connected Wallet' : 'Connect Wallet'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isConnected
              ? 'View your connected wallet address and disconnect if needed.'
              : 'Choose a wallet provider to connect securely.'}
          </DialogDescription>
        </DialogHeader>

        {isConnected ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#6C5CE7]/10 to-[#00F5D4]/10 border border-[#6C5CE7]/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Your Address</p>
                  <p className="text-lg font-mono text-white">{formatAddress(address!)}</p>
                </div>
                <button
                  onClick={handleCopy}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-[#00F5D4]" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-200">
                  <p className="font-semibold mb-1">Security Reminders:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Never share your seed phrase</li>
                    <li>• We will never ask for private keys</li>
                    <li>• All transactions require wallet confirmation</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={handleDisconnect}
              className="w-full py-3 px-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-xl transition-all flex items-center justify-center gap-2 text-red-400 hover:text-red-300"
            >
              <LogOut className="w-5 h-5" />
              Disconnect Wallet
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="mb-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-200">
                  <p className="font-semibold mb-1">Before connecting:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Make sure you're on the correct website</li>
                    <li>• Never share your private keys or seed phrase</li>
                    <li>• Only approve trusted transactions</li>
                  </ul>
                </div>
              </div>
            </div>

            {uniqueConnectors.map((item) => {
              const isThisConnectorPending = isPending && activeConnectorKey === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => void handleConnect(item)}
                  disabled={isPending}
                  className="w-full p-4 rounded-xl bg-gradient-to-r from-[#6C5CE7]/10 to-[#00F5D4]/10 border border-[#6C5CE7]/30 hover:border-[#6C5CE7]/60 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{item.info.icon}</span>
                    <div className="text-left flex-1">
                      <p className="text-white font-semibold group-hover:text-[#00F5D4] transition-colors">
                        {isThisConnectorPending ? `Connecting ${item.info.name}...` : item.info.name}
                      </p>
                      <p className="text-xs text-gray-400">{item.info.description}</p>
                    </div>
                    <Wallet className="w-5 h-5 text-gray-400 group-hover:text-[#6C5CE7] transition-colors" />
                  </div>
                </button>
              );
            })}

            <div className="pt-4 border-t border-white/10">
              <p className="text-xs text-gray-400 text-center">
                By connecting a wallet, you agree to our Terms of Service
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

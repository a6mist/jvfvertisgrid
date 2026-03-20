import { http, createConfig } from 'wagmi';
import { mainnet, bsc, polygon } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

// WalletConnect Project ID - Replace with your actual project ID
const projectId = 'YOUR_WALLETCONNECT_PROJECT_ID';

export const config = createConfig({
  chains: [mainnet, bsc, polygon],
  connectors: [
    injected({ 
      target: 'metaMask',
    }),
    walletConnect({ 
      projectId,
      showQrModal: true,
      metadata: {
        name: 'wearelegend',
        description: 'Web3 IDO Launchpad',
        url: 'https://wearelegend.io',
        icons: ['https://wearelegend.io/icon.png']
      }
    }),
    coinbaseWallet({
      appName: 'wearelegend',
      appLogoUrl: 'https://wearelegend.io/icon.png'
    })
  ],
  transports: {
    [mainnet.id]: http(),
    [bsc.id]: http(),
    [polygon.id]: http(),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}

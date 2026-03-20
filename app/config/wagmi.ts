import { http, createConfig } from 'wagmi';
import { mainnet, bsc, polygon } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';

const projectId =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '837f8ebbe4c248fe3b3df2895ff53db1';

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

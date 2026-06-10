import { http, createConfig, fallback } from 'wagmi';
import { defineChain } from 'viem';
import { injected, walletConnect } from 'wagmi/connectors';

// GembaBlockchain Testnet (EVM chainId 821207, native GMB).
export const gembaTestnet = defineChain({
  id: 821207,
  name: 'GembaBlockchain Testnet',
  nativeCurrency: { name: 'Gemba', symbol: 'GMB', decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        'https://testnet.gembascan.io/rpc',
        'https://rpc1.gembascan.io',
        'https://rpc2.gembascan.io',
      ],
    },
  },
  blockExplorers: { default: { name: 'GembaScan', url: 'https://testnet.gembascan.io' } },
  testnet: true,
});

export const SUPPORTED_CHAINS = [gembaTestnet];
export const DEFAULT_CHAIN = gembaTestnet;

const WC_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

const connectors = [injected({ shimDisconnect: true })];
if (WC_PROJECT_ID) {
  connectors.push(
    walletConnect({
      projectId: WC_PROJECT_ID,
      metadata: {
        name: 'GembaEscrow',
        description: 'On-chain escrow on GembaBlockchain',
        url: 'https://escrow.gembait.com',
        icons: ['https://escrow.gembait.com/favicon.svg'],
      },
      showQrModal: true,
    })
  );
}

export const config = createConfig({
  chains: SUPPORTED_CHAINS,
  connectors,
  transports: {
    [gembaTestnet.id]: fallback([
      http('https://rpc1.gembascan.io'),
      http('https://rpc2.gembascan.io'),
      http('https://testnet.gembascan.io/rpc'),
    ]),
  },
});

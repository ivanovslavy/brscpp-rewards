import { useMemo } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import { useWalletClient, usePublicClient } from 'wagmi';

export function walletClientToSigner(walletClient) {
  const { account, chain, transport } = walletClient;
  const network = { chainId: chain.id, name: chain.name, ensAddress: chain.contracts?.ensRegistry?.address };
  const provider = new BrowserProvider(transport, network);
  return new JsonRpcSigner(provider, account.address);
}

export function publicClientToProvider(publicClient) {
  const { chain, transport } = publicClient;
  const network = { chainId: chain.id, name: chain.name, ensAddress: chain.contracts?.ensRegistry?.address };
  return new BrowserProvider(transport, network);
}

export function useEthersSigner({ chainId } = {}) {
  const { data: walletClient } = useWalletClient({ chainId });
  return useMemo(() => (walletClient ? walletClientToSigner(walletClient) : null), [walletClient]);
}

export function useEthersProvider({ chainId } = {}) {
  const publicClient = usePublicClient({ chainId });
  return useMemo(() => (publicClient ? publicClientToProvider(publicClient) : null), [publicClient]);
}

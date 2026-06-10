// Ask the wallet to switch to GembaBlockchain testnet (adds it if missing).
export async function switchToGemba() {
  if (!window.ethereum) return false;
  const params = {
    chainId: '0xc87d7', // 821207
    chainName: 'GembaBlockchain Testnet',
    rpcUrls: ['https://testnet.gembascan.io/rpc'],
    nativeCurrency: { name: 'Gemba', symbol: 'GMB', decimals: 18 },
    blockExplorerUrls: ['https://testnet.gembascan.io'],
  };
  try {
    await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: params.chainId }] });
    return true;
  } catch (e) {
    if (e && (e.code === 4902 || e.code === -32603)) {
      try {
        await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [params] });
        return true;
      } catch { return false; }
    }
    return false;
  }
}

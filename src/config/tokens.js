// Canonical payment/prize tokens on GembaBlockchain testnet (native GMB + test stablecoins).
export const ZERO = '0x0000000000000000000000000000000000000000';

export const NATIVE = { symbol: 'GMB', name: 'Gemba', address: ZERO, decimals: 18, isNative: true };

export const STABLES = [
  { symbol: 'USDT', name: 'Tether USD (Test)', address: '0x0821EAAE0328b02d6f85C36925acb92E90ef680C', decimals: 6 },
  { symbol: 'USDC', name: 'USD Coin (Test)', address: '0x131f3087ecabA6f7ae91439DDaF70f4269D4b9Ef', decimals: 6 },
  { symbol: 'EURC', name: 'Euro Coin (Test)', address: '0x05003C73FfEC1c2f56021549501Dd7AD850e39C3', decimals: 6 },
];

export const ALL_TOKENS = [NATIVE, ...STABLES];

export function tokenByAddress(addr) {
  if (!addr || /^0x0+$/i.test(addr)) return NATIVE;
  return STABLES.find((t) => t.address.toLowerCase() === addr.toLowerCase()) || null;
}

// Resolve the token a contest/deal uses (native flag or stored token address).
export function tokenFor(isNative, tokenAddress) {
  if (isNative) return NATIVE;
  return tokenByAddress(tokenAddress) || { symbol: 'ERC-20', name: 'ERC-20', address: tokenAddress, decimals: 18 };
}

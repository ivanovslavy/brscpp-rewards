import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { useTranslation } from 'react-i18next';
import { DEFAULT_CHAIN } from '../config/wagmi';

export default function WalletButton({ role }) {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const wrongNetwork = isConnected && chainId !== DEFAULT_CHAIN.id;

  if (!isConnected) {
    const injected = connectors.find(c => c.id === 'injected' || c.type === 'injected') || connectors[0];
    return (
      <button
        onClick={() => injected && connect({ connector: injected })}
        disabled={isPending || !injected}
        className="btn-flat primary text-xs"
        style={{ padding: '8px 14px' }}
      >
        {isPending ? t('wallet.connecting') : t('wallet.connect')}
      </button>
    );
  }

  if (wrongNetwork) {
    return (
      <button
        onClick={() => switchChain({ chainId: DEFAULT_CHAIN.id })}
        className="btn-flat text-xs"
        style={{ padding: '8px 14px', color: '#D97706', borderColor: 'rgba(217,119,6,0.3)', background: 'rgba(217,119,6,0.08)' }}
      >
        {t('wallet.switchNetwork')}
      </button>
    );
  }

  const short = `${address.slice(0, 6)}…${address.slice(-4)}`;

  return (
    <div className="flex items-center gap-2">
      <span
        className="text-xs px-2.5 py-1 rounded-md font-mono"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
        }}
      >
        {short}
      </span>
      <button
        onClick={() => disconnect()}
        className="w-7 h-7 flex items-center justify-center cursor-pointer rounded-md"
        style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
        title={t('wallet.disconnect')}
        aria-label={t('wallet.disconnect')}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
}

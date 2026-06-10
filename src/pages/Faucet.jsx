import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Contract, BrowserProvider } from 'ethers';
import toast from 'react-hot-toast';
import { CONTRACTS, FAUCET_ABI, NETWORK_CONFIG } from '../contracts/hardhat-config';
import { ALL_TOKENS } from '../config/tokens';
import { switchToGemba } from '../lib/switchChain';

const DRIP = { GMB: '0.1', USDT: '10,000', USDC: '10,000', EURC: '10,000' };

function TxLink({ hash, label }) {
  return (
    <span>{label}{' '}
      <a href={`${NETWORK_CONFIG.blockExplorer}/tx/${hash}`} target="_blank" rel="noopener noreferrer"
        style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>GembaScan</a>
    </span>
  );
}

export default function Faucet({ factory }) {
  const { t } = useTranslation();
  const { signer, provider, address, isConnected, correctChain } = factory;
  const [avail, setAvail] = useState({});
  const [busy, setBusy] = useState('');
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  const loadStatus = useCallback(async () => {
    if (!window.ethereum) return;
    let acct = address;
    try {
      if (!acct) { const a = await window.ethereum.request({ method: 'eth_accounts' }); acct = a && a[0]; }
      if (!acct) return;
      const bp = new BrowserProvider(window.ethereum);
      const net = await bp.getNetwork();
      if (Number(net.chainId) !== 821207) return;
      const faucet = new Contract(CONTRACTS.FAUCET, FAUCET_ABI, bp);
      const next = {};
      next.GMB = Number(await faucet.gmbAvailableAt(acct));
      for (const tok of ALL_TOKENS) {
        if (tok.isNative) continue;
        next[tok.symbol] = Number(await faucet.tokenAvailableAt(acct, tok.address));
      }
      setAvail(next);
    } catch (e) { console.error('faucet status', e); }
  }, [address]);

  useEffect(() => {
    loadStatus();
    const id = setInterval(loadStatus, 15000);
    return () => clearInterval(id);
  }, [loadStatus]);

  // live clock so the countdown ticks down
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const claim = async (tok) => {
    if (!window.ethereum) return toast.error(t('faucet.connectFirst'));
    setBusy(tok.symbol);
    const tid = toast.loading(t('common.submitting'));
    try {
      await switchToGemba();
      const dSigner = await new BrowserProvider(window.ethereum).getSigner();
      const faucet = new Contract(CONTRACTS.FAUCET, FAUCET_ABI, dSigner);
      const tx = tok.isNative ? await faucet.claimGMB() : await faucet.claimToken(tok.address);
      toast.loading(t('common.confirming'), { id: tid });
      await tx.wait();
      toast.success(<TxLink hash={tx.hash} label={t('faucet.claimed', { sym: tok.symbol })} />, { id: tid, duration: 8000 });
      loadStatus();
      setTimeout(loadStatus, 2000);
      setTimeout(loadStatus, 5000);
    } catch (err) {
      toast.error(err?.shortMessage || err?.reason || t('faucet.failed'), { id: tid });
    } finally {
      setBusy('');
    }
  };

  const cooldownLabel = (ts) => {
    if (!ts || ts <= now) return null;
    const s = ts - now;
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    const left = h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${sec}s` : `${sec}s`;
    return t('faucet.availableIn', { t: left });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold animate-fade-up" style={{ fontFamily: 'var(--font-display)' }}>{t('faucet.title')}</h1>
      <p className="mt-2 mb-7 animate-fade-up delay-100" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{t('faucet.subtitle')}</p>

      {!isConnected ? (
        <div className="card text-center" style={{ color: 'var(--text-secondary)' }}>{t('faucet.connectFirst')}</div>
      ) : !correctChain ? (
        <div className="card text-center" style={{ color: 'var(--text-secondary)' }}>{t('faucet.wrongNetwork', { name: NETWORK_CONFIG.chainName })}</div>
      ) : (
        <div className="space-y-3 animate-fade-up delay-100">
          {ALL_TOKENS.map((tok) => {
            const cd = cooldownLabel(avail[tok.symbol]);
            const disabled = busy === tok.symbol || !!cd;
            return (
              <div key={tok.symbol} className="card flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>{DRIP[tok.symbol]} {tok.symbol}</div>
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{tok.name}{tok.isNative ? '' : ` · ${tok.symbol === 'EURC' ? '€' : '$'} test stablecoin`}</div>
                </div>
                <button className="btn-flat primary" disabled={disabled} onClick={() => claim(tok)} style={{ whiteSpace: 'nowrap', minWidth: 120, justifyContent: 'center' }}>
                  {busy === tok.symbol ? '…' : cd || t('faucet.claim')}
                </button>
              </div>
            );
          })}
          <p className="text-xs text-center pt-2" style={{ color: 'var(--text-tertiary)', lineHeight: 1.6 }}>{t('faucet.note')}</p>
        </div>
      )}

      <div className="mt-8 card animate-fade-up delay-200">
        <h2 className="text-base font-semibold mb-3" style={{ fontFamily: 'var(--font-display)' }}>{t('faucet.tokensTitle')}</h2>
        <div className="space-y-2 text-sm">
          {ALL_TOKENS.filter((x) => !x.isNative).map((tok) => (
            <div key={tok.symbol} className="flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 6 }}>
              <span style={{ color: 'var(--text-secondary)' }}>{tok.symbol}</span>
              <a href={`${NETWORK_CONFIG.blockExplorer}/address/${tok.address}`} target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--color-primary)', fontFamily: 'monospace', fontSize: 12 }}>
                {tok.address.slice(0, 10)}…{tok.address.slice(-6)}
              </a>
            </div>
          ))}
        </div>
        <p className="text-xs mt-3" style={{ color: 'var(--text-tertiary)' }}>{t('faucet.addToWallet')}</p>
      </div>
    </div>
  );
}

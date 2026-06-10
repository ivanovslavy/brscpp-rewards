import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useParams } from 'react-router-dom';
import { parseEther } from 'ethers';
import toast from 'react-hot-toast';
import { NETWORK_CONFIG, CONTRACTS } from '../contracts/hardhat-config';

const shortAddr = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '—');

function TxLink({ hash, label }) {
  return (
    <span>{label}{' '}
      <a href={`${NETWORK_CONFIG.blockExplorer}/tx/${hash}`} target="_blank" rel="noopener noreferrer"
        style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>GembaScan</a>
    </span>
  );
}

export default function Settings({ factory }) {
  const { t } = useTranslation();
  const { lang } = useParams();
  const { factorySigner, role, stats, address } = factory;

  const [newFee, setNewFee] = useState('');
  const [recipient, setRecipient] = useState('');
  const [busy, setBusy] = useState('');

  // Factory-owner only. While role is still loading (null) we render nothing; once known
  // and not owner → bounce home.
  if (role && role !== 'owner') return <Navigate to={`/${lang}`} replace />;
  if (!role) return <div className="max-w-2xl mx-auto px-4 py-20 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>…</div>;

  const run = async (key, fn) => {
    if (!factorySigner) return;
    setBusy(key);
    const tid = toast.loading(t('common.submitting'));
    try {
      const tx = await fn();
      toast.loading(t('common.confirming'), { id: tid });
      await tx.wait();
      toast.success(<TxLink hash={tx.hash} label={t('common.done')} />, { id: tid, duration: 8000 });
      factory.reload();
    } catch (err) {
      toast.error(err?.shortMessage || err?.reason || t('common.failed'), { id: tid });
    } finally {
      setBusy('');
    }
  };

  const onSetFee = () => {
    if (newFee === '' || isNaN(Number(newFee)) || Number(newFee) < 0) return toast.error(t('settings.feeInvalid'));
    run('fee', () => factorySigner.setDeployFee(parseEther(String(newFee))));
  };
  const onWithdraw = () => {
    const to = (recipient.trim() || address || '');
    if (!/^0x[a-fA-F0-9]{40}$/.test(to)) return toast.error(t('settings.recipientInvalid'));
    run('withdraw', () => factorySigner.withdrawFees(to));
  };
  const onPause = () => run('pause', () => factorySigner.pauseFactory(!stats?.isPaused));

  const collected = stats ? parseFloat(stats.collectedFees) : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold animate-fade-up" style={{ fontFamily: 'var(--font-display)' }}>{t('settings.title')}</h1>
      <p className="mt-2 mb-7 animate-fade-up delay-100" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{t('settings.subtitle')}</p>

      {/* status */}
      <div className="card animate-fade-up delay-100">
        <div className="space-y-3 text-sm">
          <Row label={t('settings.status')} value={
            <span className="status-pill" style={stats?.isPaused ? { color: '#DC2626', borderColor: 'rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.08)' } : {}}>
              {stats?.isPaused ? t('settings.paused') : t('settings.live')}
            </span>} />
          <Row label={t('settings.currentFee')} value={stats ? `${stats.deployFee} GMB` : '—'} />
          <Row label={t('settings.collected')} value={`${collected.toFixed(4)} GMB`} />
          <Row label={t('settings.factory')} value={
            <a href={`${NETWORK_CONFIG.blockExplorer}/address/${CONTRACTS.FACTORY}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>
              <Mono>{shortAddr(CONTRACTS.FACTORY)}</Mono>
            </a>} />
        </div>
      </div>

      {/* set fee */}
      <div className="card mt-5 animate-fade-up delay-200">
        <h2 className="text-base font-semibold mb-1" style={{ fontFamily: 'var(--font-display)' }}>{t('settings.setFeeTitle')}</h2>
        <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>{t('settings.setFeeHint')}</p>
        <div className="flex gap-2">
          <input className="form-input" type="number" min={0} step="0.0001" value={newFee} onChange={(e) => setNewFee(e.target.value)} placeholder={stats?.deployFee ?? '0'} />
          <button className="btn-flat primary" disabled={busy === 'fee'} onClick={onSetFee} style={{ whiteSpace: 'nowrap' }}>
            {busy === 'fee' ? '…' : t('settings.setFeeCta')}
          </button>
        </div>
      </div>

      {/* withdraw */}
      <div className="card mt-5 animate-fade-up delay-200">
        <h2 className="text-base font-semibold mb-1" style={{ fontFamily: 'var(--font-display)' }}>{t('settings.withdrawTitle')}</h2>
        <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>{t('settings.withdrawHint')}</p>
        <input className="form-input mb-2" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder={address || '0x… recipient'} spellCheck={false} />
        <button className="btn-flat primary w-full justify-center" disabled={busy === 'withdraw' || collected <= 0} onClick={onWithdraw}>
          {busy === 'withdraw' ? '…' : t('settings.withdrawCta', { amount: collected.toFixed(4) })}
        </button>
      </div>

      {/* pause */}
      <div className="card mt-5 animate-fade-up delay-200">
        <h2 className="text-base font-semibold mb-1" style={{ fontFamily: 'var(--font-display)' }}>{t('settings.pauseTitle')}</h2>
        <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>{t('settings.pauseHint')}</p>
        <button className={stats?.isPaused ? 'btn-flat primary w-full justify-center' : 'btn-outline w-full justify-center'} disabled={busy === 'pause'} onClick={onPause}>
          {busy === 'pause' ? '…' : stats?.isPaused ? t('settings.unpauseCta') : t('settings.pauseCta')}
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
    </div>
  );
}
function Mono({ children }) {
  return <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '0.8em' }}>{children}</span>;
}

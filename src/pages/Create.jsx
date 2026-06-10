import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { NETWORK_CONFIG } from '../contracts/hardhat-config';

function TxLink({ hash, label }) {
  return (
    <span>
      {label}{' '}
      <a href={`${NETWORK_CONFIG.blockExplorer}/tx/${hash}`} target="_blank" rel="noopener noreferrer"
        style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>
        GembaScan
      </a>
    </span>
  );
}

const ZERO = '0x0000000000000000000000000000000000000000';

export default function Create({ factory }) {
  const { t } = useTranslation();
  const { lang } = useParams();
  const navigate = useNavigate();
  const { factorySigner, isConnected, correctChain, stats } = factory;

  const [form, setForm] = useState({ name: '', tokenType: 'native', tokenAddress: '', deadlineDays: 7, positionCount: 1 });
  const [submitting, setSubmitting] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (!isConnected) {
    return <Prompt text={t('create.connectFirst')} />;
  }
  if (!correctChain) {
    return <Prompt text={t('create.wrongNetwork', { name: NETWORK_CONFIG.chainName })} />;
  }

  const positionCount = parseInt(form.positionCount, 10) || 0;
  const deadlineDays = parseInt(form.deadlineDays, 10) || 0;
  const isNative = form.tokenType === 'native';

  const submit = async (e) => {
    e.preventDefault();
    if (!factorySigner) return;
    if (!form.name.trim()) return toast.error(t('create.errors.name'));
    if (!(positionCount >= 1 && positionCount <= 50)) return toast.error(t('create.errors.positions'));
    if (!(deadlineDays >= 1 && deadlineDays <= 365)) return toast.error(t('create.errors.deadline'));
    const tokenAddress = isNative ? ZERO : form.tokenAddress.trim();
    if (!isNative && !/^0x[a-fA-F0-9]{40}$/.test(tokenAddress)) return toast.error(t('create.errors.token'));

    setSubmitting(true);
    const tid = toast.loading(t('create.submitting'));
    try {
      const params = { name: form.name.trim(), isNativeToken: isNative, tokenAddress, deadlineDays, positionCount };
      const tx = await factorySigner.createBounty(params, { value: stats?.deployFeeWei ?? 0n });
      toast.loading(t('create.confirming'), { id: tid });
      await tx.wait();
      toast.success(<TxLink hash={tx.hash} label={t('create.success')} />, { id: tid, duration: 9000 });
      factory.reload();
      navigate(`/${lang}/contests`);
    } catch (err) {
      toast.error(err?.shortMessage || err?.reason || t('create.failed'), { id: tid });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-12 animate-fade-up">
      <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{t('create.title')}</h1>
      <p className="mt-2 mb-7" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{t('create.subtitle')}</p>

      <form onSubmit={submit} className="card space-y-5">
        <div>
          <label className="form-label">{t('create.name')}</label>
          <input className="form-input" value={form.name} onChange={set('name')} placeholder={t('create.namePlaceholder')} maxLength={80} />
        </div>

        <div>
          <label className="form-label">{t('create.prize')}</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setForm((f) => ({ ...f, tokenType: 'native' }))}
              className={isNative ? 'btn-flat primary' : 'btn-flat'} style={{ flex: 1 }}>GMB ({t('create.native')})</button>
            <button type="button" onClick={() => setForm((f) => ({ ...f, tokenType: 'erc20' }))}
              className={!isNative ? 'btn-flat primary' : 'btn-flat'} style={{ flex: 1 }}>ERC-20</button>
          </div>
          {!isNative && (
            <input className="form-input mt-2" value={form.tokenAddress} onChange={set('tokenAddress')}
              placeholder="0x… token address" spellCheck={false} />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">{t('create.positions')}</label>
            <input className="form-input" type="number" min={1} max={50} value={form.positionCount} onChange={set('positionCount')} />
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{t('create.positionsHint')}</p>
          </div>
          <div>
            <label className="form-label">{t('create.deadlineDays')}</label>
            <input className="form-input" type="number" min={1} max={365} value={form.deadlineDays} onChange={set('deadlineDays')} />
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{t('create.deadlineHint')}</p>
          </div>
        </div>

        <div className="rounded-xl p-4 text-sm" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div className="flex justify-between"><span style={{ color: 'var(--text-secondary)' }}>{t('create.deployFee')}</span>
            <span style={{ fontWeight: 600 }}>{stats ? `${stats.deployFee} GMB` : '—'}</span></div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)', lineHeight: 1.5 }}>{t('create.feeNote')}</p>
        </div>

        <button type="submit" disabled={submitting} className="btn-flat primary w-full justify-center">
          {submitting ? t('create.submitting') : t('create.cta')}
        </button>
        <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>{t('create.ownerNote')}</p>
      </form>
    </div>
  );
}

function Prompt({ text }) {
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center animate-fade-up">
      <p style={{ color: 'var(--text-secondary)' }}>{text}</p>
    </div>
  );
}

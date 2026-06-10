import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BrowserProvider, Contract } from 'ethers';
import { NETWORK_CONFIG, CONTRACTS, FACTORY_ABI } from '../contracts/hardhat-config';
import { ALL_TOKENS } from '../config/tokens';
import { usePayment } from '../lib/usePayment';
import PaymentGate from '../components/PaymentGate';
import { switchToGemba } from '../lib/switchChain';

function TxLink({ hash, label }) {
  return (
    <span>{label}{' '}
      <a href={`${NETWORK_CONFIG.blockExplorer}/tx/${hash}`} target="_blank" rel="noopener noreferrer"
        style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>GembaScan</a>
    </span>
  );
}

export default function Create({ factory }) {
  const { t } = useTranslation();
  const { lang } = useParams();
  const navigate = useNavigate();
  const { factorySigner, isConnected, correctChain, stats } = factory;

  const FORM_KEY = 'gembawin-create-form';
  const EMPTY = { name: '', token: 'GMB', deadlineDays: 7, positionCount: 1 };
  const [form, setForm] = useState(() => { try { return JSON.parse(localStorage.getItem(FORM_KEY)) || EMPTY; } catch { return EMPTY; } });
  useEffect(() => { localStorage.setItem(FORM_KEY, JSON.stringify(form)); }, [form]);
  const [submitting, setSubmitting] = useState(false);
  const payment = usePayment();
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (!isConnected) return <Prompt text={t('create.connectFirst')} />;
  if (!correctChain) return <Prompt text={t('create.wrongNetwork', { name: NETWORK_CONFIG.chainName })} />;

  const positionCount = parseInt(form.positionCount, 10) || 0;
  const deadlineDays = parseInt(form.deadlineDays, 10) || 0;
  const selected = ALL_TOKENS.find((x) => x.symbol === form.token) || ALL_TOKENS[0];

  const validate = () => {
    if (!form.name.trim()) { toast.error(t('create.errors.name')); return false; }
    if (!(positionCount >= 1 && positionCount <= 50)) { toast.error(t('create.errors.positions')); return false; }
    if (!(deadlineDays >= 1 && deadlineDays <= 365)) { toast.error(t('create.errors.deadline')); return false; }
    return true;
  };

  const doDeploy = async () => {
    if (!validate()) return;
    if (!window.ethereum) { toast.error(t('create.connectFirst')); return; }
    const oid = payment.orderId || '';
    setSubmitting(true);
    const tid = toast.loading(t('create.submitting'));
    try {
      await switchToGemba();
      const dSigner = await new BrowserProvider(window.ethereum).getSigner();
      const factoryC = new Contract(CONTRACTS.FACTORY, FACTORY_ABI, dSigner);
      const params = {
        name: form.name.trim(),
        isNativeToken: !!selected.isNative,
        tokenAddress: selected.address,
        deadlineDays,
        positionCount,
      };
      const tx = await factoryC.createBounty(params, oid, { value: stats?.deployFeeWei ?? 0n });
      toast.loading(t('create.confirming'), { id: tid });
      await tx.wait();
      toast.success(<TxLink hash={tx.hash} label={t('create.success')} />, { id: tid, duration: 9000 });
      localStorage.removeItem(FORM_KEY);
      if (oid) fetch('/api/redeem-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: oid }) }).catch(() => {});
      payment.reset();
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

      <form onSubmit={(e) => e.preventDefault()} className="card space-y-5">
        <div>
          <label className="form-label">{t('create.name')}</label>
          <input className="form-input" value={form.name} onChange={set('name')} placeholder={t('create.namePlaceholder')} maxLength={80} />
        </div>

        <div>
          <label className="form-label">{t('create.prize')}</label>
          <div className="grid grid-cols-4 gap-2">
            {ALL_TOKENS.map((tok) => (
              <button key={tok.symbol} type="button" onClick={() => setForm((f) => ({ ...f, token: tok.symbol }))}
                className={form.token === tok.symbol ? 'btn-flat primary' : 'btn-flat'} style={{ justifyContent: 'center' }}>
                {tok.symbol}
              </button>
            ))}
          </div>
          <p className="text-xs mt-1.5" style={{ color: 'var(--text-tertiary)' }}>
            {selected.isNative ? t('create.nativeHint') : t('create.stableHint', { name: selected.name })}
          </p>
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

        <PaymentGate payment={payment} validate={validate} onDeploy={doDeploy} deploying={submitting} deployLabel={t('create.cta')} />
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

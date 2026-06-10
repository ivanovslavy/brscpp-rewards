import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Owner-only control to change the GembaPay creation fee. The owner signs a message with
// their wallet; the backend verifies the signer is the factory owner (not the app).
export default function CreationFee({ signer }) {
  const { t } = useTranslation();
  const [cur, setCur] = useState(null);
  const [val, setVal] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = () => fetch('/api/creation-fee').then((r) => r.json()).then(setCur).catch(() => {});
  useEffect(() => { load(); }, []);

  const update = async () => {
    const amt = Number(val);
    if (!(amt >= 0)) { setMsg({ err: true, text: t('settings.feeInvalid', 'Enter a valid amount') }); return; }
    if (!signer) { setMsg({ err: true, text: t('settings.connectFirst', 'Connect your wallet') }); return; }
    setBusy(true); setMsg(null);
    try {
      const message = `Set creation fee to ${amt} EUR`;
      const signature = await signer.signMessage(message);
      const r = await fetch('/api/admin/set-fee', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountEur: amt, message, signature }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) setMsg({ err: true, text: d.error || t('settings.feeFailed', 'Update failed') });
      else { setMsg({ err: false, text: t('settings.feeUpdated', 'Creation fee updated') }); setVal(''); load(); }
    } catch (e) {
      setMsg({ err: true, text: e?.shortMessage || e?.message || t('settings.feeFailed', 'Update failed') });
    } finally { setBusy(false); }
  };

  return (
    <div className="card animate-fade-up delay-200">
      <h2 className="text-base font-semibold mb-1" style={{ fontFamily: 'var(--font-display)' }}>{t('settings.feeTitle', 'GembaPay creation fee')}</h2>
      <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>{t('settings.feeHint', 'The fiat fee charged via GembaPay to create a contract. Owner only.')}</p>
      <div className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
        {t('settings.feeCurrent', 'Current')}: <strong style={{ color: 'var(--text-primary)' }}>{cur ? `${cur.amountEur} ${cur.currency}` : '—'}</strong>
        {cur && !cur.configured ? ` · ${t('settings.feeNotConfigured', 'GembaPay merchant not configured yet')}` : ''}
      </div>
      <div className="flex gap-2">
        <input className="form-input" type="number" min={0} step="1" value={val} onChange={(e) => setVal(e.target.value)} placeholder={cur ? String(cur.amountEur) : '10'} />
        <button className="btn-flat primary" style={{ whiteSpace: 'nowrap' }} disabled={busy} onClick={update}>
          {busy ? '…' : t('settings.feeCta', 'Set fee')}
        </button>
      </div>
      {msg && <p className="text-xs mt-2" style={{ color: msg.err ? '#DC2626' : '#16A34A' }}>{msg.text}</p>}
    </div>
  );
}

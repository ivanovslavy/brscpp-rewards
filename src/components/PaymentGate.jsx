import { useTranslation } from 'react-i18next';

/**
 * Gates the on-chain deploy behind a GembaPay creation-fee payment.
 *  - merchant not configured  -> direct (free) deploy
 *  - idle      -> "Pay €X & Create" (validates the form, then opens GembaPay in a new tab)
 *  - awaiting  -> animated "awaiting payment" (polls the backend, webhook-driven)
 *  - paid      -> "Payment received ✓" + the deploy button
 *  - failed    -> retry
 *
 * Props: payment (usePayment), validate()->bool, onDeploy(), deploying:bool, deployLabel.
 */
export default function PaymentGate({ payment, validate, onDeploy, deploying, deployLabel }) {
  const { t } = useTranslation();
  const { status, fee, error, startPayment, reopenPayment, reset } = payment;
  const feeLabel = fee ? `${fee.amountEur} ${fee.currency}` : '';
  const label = deployLabel || t('pay.deploy');

  // merchant not configured yet -> free direct deploy
  if (fee && !fee.configured) {
    return (
      <button className="btn-flat primary w-full justify-center" disabled={deploying}
        onClick={() => { if (validate()) onDeploy(); }}>
        {deploying ? '…' : label}
      </button>
    );
  }

  if (status === 'paid') {
    return (
      <div className="space-y-3">
        <div className="rounded-xl p-3 text-sm text-center" style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.3)', color: '#16A34A' }}>
          ✓ {t('pay.received')}
        </div>
        <button className="btn-flat primary w-full justify-center" disabled={deploying} onClick={onDeploy}>
          {deploying ? '…' : label}
        </button>
      </div>
    );
  }

  if (status === 'awaiting') {
    return (
      <div className="rounded-xl p-5 text-center" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <div className="pay-pulse" style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--color-primary, #4F46E5)', margin: '0 auto 12px' }} />
        <div className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>{t('pay.awaiting')}</div>
        <p className="text-xs mt-1.5 mb-3" style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{t('pay.awaitingHint')}</p>
        <div className="flex gap-2 justify-center">
          <button className="btn-flat" onClick={reopenPayment}>{t('pay.reopen')}</button>
          <button className="btn-outline" onClick={reset}>{t('pay.cancel')}</button>
        </div>
        <style>{`@keyframes payPulse{0%,100%{opacity:.3;transform:scale(.85)}50%{opacity:1;transform:scale(1.15)}}.pay-pulse{animation:payPulse 1.1s ease-in-out infinite}`}</style>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="space-y-3">
        <div className="rounded-xl p-3 text-sm text-center" style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)', color: '#DC2626' }}>
          {t('pay.failed')}
        </div>
        <button className="btn-flat primary w-full justify-center" onClick={reset}>{t('pay.retry')}</button>
      </div>
    );
  }

  // idle / creating -> pay button
  return (
    <>
      {error && <div className="text-xs text-center mb-2" style={{ color: '#DC2626' }}>{error}</div>}
      <button className="btn-flat primary w-full justify-center" disabled={status === 'creating'}
        onClick={() => { if (validate()) startPayment(); }}>
        {status === 'creating' ? '…' : t('pay.payAndCreate', { fee: feeLabel })}
      </button>
    </>
  );
}

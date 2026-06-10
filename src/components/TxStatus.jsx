import { useTranslation } from 'react-i18next';
import { NETWORK_CONFIG } from '../contracts/hardhat-config';

export default function TxStatus({ status, txHash }) {
  const { t } = useTranslation();
  if (!status) return null;
  const map = {
    pending: { text: t('tx.pending'), color: '#D97706', spin: true },
    processing: { text: t('tx.processing'), color: '#0E7490', spin: true },
    success: { text: t('tx.success'), color: '#059669', spin: false },
    failed: { text: t('tx.failed'), color: '#DC2626', spin: false },
  };
  const info = map[status];
  if (!info) return null;
  return (
    <div
      className="mt-4 p-3 rounded-lg flex items-center gap-3"
      style={{ backgroundColor: `${info.color}12`, border: `1px solid ${info.color}40` }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={info.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={info.spin ? 'spin' : ''}>
        {info.spin
          ? <><path d="M21 12a9 9 0 1 1-6.219-8.56"/></>
          : status === 'success'
            ? <><polyline points="20 6 9 17 4 12"/></>
            : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}
      </svg>
      <div className="flex-1 text-sm">
        <div style={{ color: info.color, fontWeight: 500 }}>{info.text}</div>
        {txHash && (
          <a href={`${NETWORK_CONFIG.blockExplorer}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-xs no-underline" style={{ color: 'var(--text-tertiary)' }}>
            {t('tx.explorer')}
          </a>
        )}
      </div>
    </div>
  );
}

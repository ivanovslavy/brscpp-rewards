import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { BrowserProvider } from 'ethers';
import { LEGAL_UPDATED } from '../lib/legal';

// On every wallet connection, ask the user for a GASLESS signature (personal_sign)
// confirming they accept the Terms of Service & Privacy Policy. Stored per address,
// so it is asked once per wallet (until the legal version changes).
const keyFor = (addr) => `tos-consent-${addr.toLowerCase()}`;
const consented = (addr) => {
  try { const r = JSON.parse(localStorage.getItem(keyFor(addr))); return r && r.v === LEGAL_UPDATED; } catch { return false; }
};

export default function ToSConsent({ appName }) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'en').slice(0, 2);
  const [addr, setAddr] = useState(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const check = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      const accs = await window.ethereum.request({ method: 'eth_accounts' });
      const a = (accs && accs[0]) || null;
      setAddr(a);
      setOpen(!!a && !consented(a));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    check();
    const id = setInterval(check, 2000); // catches the wagmi connect flow
    const eth = window.ethereum;
    if (eth && eth.on) eth.on('accountsChanged', check);
    return () => {
      clearInterval(id);
      if (eth && eth.removeListener) eth.removeListener('accountsChanged', check);
    };
  }, [check]);

  const agree = async () => {
    if (!addr || !window.ethereum) return;
    setBusy(true); setErr(null);
    try {
      const message = t('tos.signMessage', { app: appName, date: LEGAL_UPDATED, addr });
      const signer = await new BrowserProvider(window.ethereum).getSigner();
      const sig = await signer.signMessage(message); // off-chain, no gas
      localStorage.setItem(keyFor(addr), JSON.stringify({ at: Date.now(), v: LEGAL_UPDATED, sig }));
      setOpen(false);
    } catch (e) {
      setErr(e?.shortMessage || e?.message || t('tos.rejected', 'Signature rejected'));
    } finally { setBusy(false); }
  };

  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}>
      <div className="card" style={{ maxWidth: 460, width: '100%' }}>
        <h2 className="text-lg font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>{t('tos.title', 'Accept the Terms')}</h2>
        <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{t('tos.body', 'To continue, please confirm that you accept our Terms of Service and Privacy Policy. You will sign a short message — this is free and gasless (no transaction, no fee).')}</p>
        <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
          <Link to={`/${lang}/terms`} onClick={() => setOpen(false)} style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>{t('tos.terms', 'Terms of Service')}</Link>
          {' · '}
          <Link to={`/${lang}/privacy`} onClick={() => setOpen(false)} style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>{t('tos.privacy', 'Privacy Policy')}</Link>
        </p>
        {err && <p className="text-xs mb-2" style={{ color: '#DC2626' }}>{err}</p>}
        <button className="btn-flat primary w-full" style={{ justifyContent: 'center' }} disabled={busy} onClick={agree}>
          {busy ? '…' : t('tos.agree', 'Agree & sign (gasless)')}
        </button>
        <p className="text-xs text-center mt-2" style={{ color: 'var(--text-tertiary)' }}>{t('tos.gasless', 'Off-chain signature · no gas · no transaction')}</p>
      </div>
    </div>
  );
}

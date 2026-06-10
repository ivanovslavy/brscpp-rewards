import { useState, useRef, useCallback, useEffect } from 'react';

// Drives the GembaPay creation-fee payment: create -> open GembaPay in a new tab ->
// poll our backend (updated by the GembaPay webhook) until paid. If the merchant isn't
// configured yet (no API key), `configured` is false and the app falls back to a direct
// (free) deploy.
export function usePayment() {
  const [status, setStatus] = useState('idle'); // idle | creating | awaiting | paid | failed
  const [orderId, setOrderId] = useState(null);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [fee, setFee] = useState(null); // { amountEur, currency, configured }
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/creation-fee').then((r) => r.json()).then((d) => { if (alive) setFee(d); }).catch(() => {});
    return () => { alive = false; clearInterval(pollRef.current); };
  }, []);

  const startPayment = useCallback(async () => {
    setError(null);
    setStatus('creating');
    try {
      const r = await fetch('/api/create-payment', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.paymentUrl) { setStatus('idle'); setError(data.error || 'Could not start payment'); return; }
      setOrderId(data.orderId);
      setPaymentUrl(data.paymentUrl);
      window.open(data.paymentUrl, '_blank', 'noopener');
      setStatus('awaiting');
      clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const s = await (await fetch(`/api/payment-status/${data.orderId}`)).json();
          if (s.status === 'paid') { clearInterval(pollRef.current); setStatus('paid'); }
          else if (s.status === 'failed') { clearInterval(pollRef.current); setStatus('failed'); }
        } catch { /* keep polling */ }
      }, 3000);
    } catch (e) {
      setStatus('idle');
      setError(e?.message || 'Payment error');
    }
  }, []);

  const reopenPayment = useCallback(() => {
    if (paymentUrl) window.open(paymentUrl, '_blank', 'noopener');
  }, [paymentUrl]);

  const reset = useCallback(() => {
    clearInterval(pollRef.current);
    setStatus('idle'); setOrderId(null); setPaymentUrl(null); setError(null);
  }, []);

  return { status, orderId, paymentUrl, fee, error, startPayment, reopenPayment, reset };
}

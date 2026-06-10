import { useState, useRef, useCallback, useEffect } from 'react';

// Drives the GembaPay creation-fee payment. Opens the checkout tab SYNCHRONOUSLY on click
// (so popup blockers don't kill it), persists the order across page refreshes, and resumes
// polling if the page reloads while awaiting. If the merchant isn't configured the app falls
// back to a direct (free) deploy.
const PKEY = 'gembapay-order';
const loadPersisted = () => { try { return JSON.parse(localStorage.getItem(PKEY)) || null; } catch { return null; } };

export function usePayment() {
  const [status, setStatus] = useState(() => loadPersisted()?.status || 'idle'); // idle|creating|awaiting|paid|failed
  const [orderId, setOrderId] = useState(() => loadPersisted()?.orderId || null);
  const [paymentUrl, setPaymentUrl] = useState(() => loadPersisted()?.paymentUrl || null);
  const [fee, setFee] = useState(null);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/creation-fee').then((r) => r.json()).then((d) => { if (alive) setFee(d); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  // persist the order across refreshes
  useEffect(() => {
    if (status === 'idle') localStorage.removeItem(PKEY);
    else localStorage.setItem(PKEY, JSON.stringify({ orderId, status, paymentUrl }));
  }, [status, orderId, paymentUrl]);

  const poll = useCallback((oid) => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const s = await (await fetch(`/api/payment-status/${oid}`)).json();
        if (s.status === 'paid') { clearInterval(pollRef.current); setStatus('paid'); }
        else if (s.status === 'failed') { clearInterval(pollRef.current); setStatus('failed'); }
      } catch { /* keep polling */ }
    }, 3000);
  }, []);

  // resume polling if we reloaded mid-payment
  useEffect(() => {
    if (status === 'awaiting' && orderId) poll(orderId);
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startPayment = useCallback(async () => {
    setError(null);
    // open the tab NOW, inside the click gesture, so the browser doesn't block it
    const win = window.open('about:blank', '_blank');
    setStatus('creating');
    try {
      const r = await fetch('/api/create-payment', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.paymentUrl) {
        if (win) win.close();
        setStatus('idle'); setError(data.error || 'Could not start payment'); return;
      }
      setOrderId(data.orderId);
      setPaymentUrl(data.paymentUrl);
      if (win) win.location.href = data.paymentUrl; else window.open(data.paymentUrl, '_blank', 'noopener');
      setStatus('awaiting');
      poll(data.orderId);
    } catch (e) {
      if (win) win.close();
      setStatus('idle');
      setError(e?.message || 'Payment error');
    }
  }, [poll]);

  const reopenPayment = useCallback(() => {
    if (paymentUrl) window.open(paymentUrl, '_blank', 'noopener');
  }, [paymentUrl]);

  const reset = useCallback(() => {
    clearInterval(pollRef.current);
    setStatus('idle'); setOrderId(null); setPaymentUrl(null); setError(null);
    localStorage.removeItem(PKEY);
  }, []);

  return { status, orderId, paymentUrl, fee, error, startPayment, reopenPayment, reset };
}

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const TURNSTILE_SITEKEY = '0x4AAAAAAC9x5sdEMg3SCV04';

export default function Contact() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);
  const tsRef = useRef(null);
  const widget = useRef(null);

  useEffect(() => {
    const dark = document.documentElement.classList.contains('dark');
    const render = () => {
      if (window.turnstile && tsRef.current && widget.current === null) {
        widget.current = window.turnstile.render(tsRef.current, { sitekey: TURNSTILE_SITEKEY, theme: dark ? 'dark' : 'light' });
      }
    };
    if (window.turnstile) render();
    else { const iv = setInterval(() => { if (window.turnstile) { render(); clearInterval(iv); } }, 200); return () => clearInterval(iv); }
    return () => { if (widget.current !== null && window.turnstile) { try { window.turnstile.remove(widget.current); } catch {} widget.current = null; } };
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    const token = window.turnstile?.getResponse(widget.current);
    if (!token) { setStatus('captcha'); return; }
    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, turnstileToken: token }),
      });
      if (!res.ok) throw new Error();
      setStatus('ok');
      setForm({ name: '', email: '', subject: '', message: '' });
      if (window.turnstile) window.turnstile.reset(widget.current);
    } catch { setStatus('err'); } finally { setSending(false); }
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-14 animate-fade-up">
      <h1 className="font-display text-3xl sm:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('contact.title')}</h1>
      <p className="mt-3" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{t('contact.subtitle')}</p>

      <form onSubmit={onSubmit} className="card mt-8 p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">{t('contact.name')}</label>
            <input required className="form-input" value={form.name} onChange={set('name')} />
          </div>
          <div>
            <label className="form-label">{t('contact.email')}</label>
            <input required type="email" className="form-input" value={form.email} onChange={set('email')} />
          </div>
        </div>
        <div>
          <label className="form-label">{t('contact.subject')}</label>
          <input required className="form-input" value={form.subject} onChange={set('subject')} />
        </div>
        <div>
          <label className="form-label">{t('contact.message')}</label>
          <textarea required rows={5} className="form-input" style={{ resize: 'vertical' }} value={form.message} onChange={set('message')} />
        </div>
        <div ref={tsRef} style={{ display: 'flex', justifyContent: 'center' }} />
        <button type="submit" disabled={sending} className="btn-flat primary w-full justify-center">
          {sending ? t('contact.sending') : t('contact.send')}
        </button>
        {status === 'ok' && <p className="text-sm" style={{ color: '#10b981' }}>{t('contact.ok')}</p>}
        {status === 'err' && <p className="text-sm" style={{ color: '#ef4444' }}>{t('contact.err')}</p>}
        {status === 'captcha' && <p className="text-sm" style={{ color: '#D97706' }}>{t('contact.captcha')}</p>}
      </form>
    </div>
  );
}

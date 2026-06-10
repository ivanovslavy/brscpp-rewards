/**
 * win.gembait.com — static host for the Vite build + contact API.
 * Replaces the previous `serve -s build` so the contact form has a backend.
 * Cloudflare Turnstile verified → email to contacts@gembait.com + a confirmation
 * copy to the submitter. Secrets come from the systemd Environment (no committed .env).
 */
const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');

const PORT = process.env.PORT || 3108;
const DIST = path.join(__dirname, 'dist');

const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY || '';
const SMTP_HOST = process.env.SMTP_HOST || 'mail.gembamail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const FROM_EMAIL = process.env.SMTP_FROM_EMAIL || SMTP_USER;
const FROM_NAME = process.env.SMTP_FROM_NAME || 'GEMBA IT Studio';
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'contacts@gembait.com';

const app = express();
app.use(express.json({ limit: '32kb' }));
app.set('trust proxy', 1);

const transporter = nodemailer.createTransport({
  host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_SECURE, requireTLS: !SMTP_SECURE,
  auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
});
transporter.verify((err) => console.log(err ? `[smtp] ${err.message}` : '[smtp] ready'));

const hits = new Map();
function limited(ip) {
  const now = Date.now(), win = 3600_000;
  const arr = (hits.get(ip) || []).filter((t) => now - t < win);
  if (arr.length >= 5) return true;
  arr.push(now); hits.set(ip, arr); return false;
}
const esc = (s) => String(s || '').replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]));
const isEmail = (s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);

async function verifyTurnstile(token, ip) {
  if (!TURNSTILE_SECRET) return false;
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: TURNSTILE_SECRET, response: token, remoteip: ip }),
    });
    return (await r.json()).success === true;
  } catch { return false; }
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/contact', async (req, res) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  if (limited(ip)) return res.status(429).json({ error: 'rate' });
  const { name, email, subject, message, turnstileToken } = req.body || {};
  if (!name || !email || !subject || !message) return res.status(400).json({ error: 'missing' });
  if (!isEmail(email)) return res.status(400).json({ error: 'email' });
  if (!(await verifyTurnstile(turnstileToken, ip))) return res.status(403).json({ error: 'captcha' });

  const from = `"${FROM_NAME}" <${FROM_EMAIL}>`;
  const safe = { name: esc(name), email: esc(email), subject: esc(subject), message: esc(message).replace(/\n/g, '<br>') };
  try {
    await transporter.sendMail({
      from, to: CONTACT_EMAIL, replyTo: email, subject: `[win.gembait.com] ${safe.subject}`,
      html: `<h2>New message from win.gembait.com</h2><p><b>Name:</b> ${safe.name}<br><b>Email:</b> ${safe.email}<br><b>Subject:</b> ${safe.subject}</p><hr><p>${safe.message}</p>`,
    });
    await transporter.sendMail({
      from, to: email, subject: `Copy of your message — GembaWin`,
      html: `<p>Hi ${safe.name},</p><p>Thanks for reaching out — we received your message and will reply soon. Here is a copy:</p><hr><p><b>Subject:</b> ${safe.subject}</p><p>${safe.message}</p><hr><p>— GembaWin · GEMBA IT</p>`,
    });
    res.json({ ok: true });
  } catch (e) {
    console.error('[contact]', e.message);
    res.status(500).json({ error: 'send' });
  }
});

app.use(express.static(DIST, { maxAge: '1h' }));
app.get('*', (_req, res) => res.sendFile(path.join(DIST, 'index.html')));

app.listen(PORT, '127.0.0.1', () => console.log(`win.gembait.com on 127.0.0.1:${PORT}`));

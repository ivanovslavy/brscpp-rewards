/**
 * GembaPay payment integration for an app backend (escrow / win).
 * Consumes the EXISTING GembaPay merchant API — makes ZERO changes to GembaPay.
 *
 * Flow: POST /api/create-payment -> GembaPay /api/merchant/payment-request -> paymentUrl
 *       GembaPay -> POST /webhooks/gembapay (HMAC x-gembapay-signature) -> order = paid
 *       GET /api/payment-status/:orderId  (frontend polls until 'paid')
 *
 * The creation fee is owner-changeable: POST /api/admin/set-fee requires a wallet
 * signature from the factory owner (verified, not the app).
 *
 * Secrets via systemd Environment: GEMBAPAY_MERCHANT_API_KEY, GEMBAPAY_WEBHOOK_SECRET,
 * GEMBAPAY_API_URL (default https://api.gembapay.com), FACTORY_OWNER.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
let ethers = null;
try { ethers = require('ethers'); } catch { /* set-fee disabled until installed */ }

const readJson = (file, fallback) => {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
};

module.exports = function registerGembaPay(app, opts = {}) {
  const appName = opts.appName || 'app';
  const dataDir = opts.dataDir || __dirname;
  const API_URL = process.env.GEMBAPAY_API_URL || 'https://api.gembapay.com';
  const API_KEY = process.env.GEMBAPAY_MERCHANT_API_KEY || '';
  const WEBHOOK_SECRET = process.env.GEMBAPAY_WEBHOOK_SECRET || '';
  const OWNER = (process.env.FACTORY_OWNER || opts.ownerAddress || '').toLowerCase();

  const PDIR = path.join(dataDir, 'payment-data');
  fs.mkdirSync(PDIR, { recursive: true });
  const FEE_FILE = path.join(PDIR, 'creation-fee.json');
  const ORDERS_FILE = path.join(PDIR, 'orders.json');

  let fee = readJson(FEE_FILE, { amountEur: 10, currency: 'EUR' });
  let orders = readJson(ORDERS_FILE, {});
  const saveFee = () => fs.writeFileSync(FEE_FILE, JSON.stringify(fee));
  const saveOrders = () => fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders));

  // prune orders older than 7 days
  const WEEK = 7 * 24 * 3600 * 1000;
  let pruned = false;
  for (const k of Object.keys(orders)) if (Date.now() - (orders[k].createdAt || 0) > WEEK) { delete orders[k]; pruned = true; }
  if (pruned) saveOrders();

  // public: current creation fee
  app.get('/api/creation-fee', (_req, res) =>
    res.json({ amountEur: fee.amountEur, currency: fee.currency, configured: !!API_KEY }));

  // create a GembaPay payment for the creation fee
  app.post('/api/create-payment', async (req, res) => {
    if (!API_KEY) return res.status(503).json({ error: 'Payments not configured yet' });
    const orderId = `${appName}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    try {
      const r = await fetch(`${API_URL}/api/merchant/payment-request`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount: Number(fee.amountEur),
          currency: fee.currency,
          description: `${appName} — create contract`,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.paymentUrl) return res.status(502).json({ error: data.error || 'Payment request failed' });
      orders[orderId] = { orderId, status: 'pending', amount: fee.amountEur, currency: fee.currency, createdAt: Date.now() };
      saveOrders();
      res.json({ orderId, paymentUrl: data.paymentUrl, amount: fee.amountEur, currency: fee.currency });
    } catch (e) {
      console.error('[gembapay] create-payment', e.message);
      res.status(502).json({ error: 'Payment gateway error' });
    }
  });

  // GembaPay -> webhook (HMAC verified)
  app.post('/webhooks/gembapay', (req, res) => {
    const sig = req.headers['x-gembapay-signature'];
    if (!sig || !WEBHOOK_SECRET || !req.rawBody) return res.status(401).json({ error: 'Unauthorized' });
    const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(req.rawBody).digest('hex');
    let ok = false;
    try { ok = sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)); } catch { ok = false; }
    if (!ok) return res.status(401).json({ error: 'Invalid signature' });

    const { event, payment } = req.body || {};
    const o = payment && payment.orderId ? orders[payment.orderId] : null;
    if (o) {
      if (event === 'payment.completed') { o.status = 'paid'; o.paidAt = Date.now(); o.txHash = payment.txHash || null; }
      else if (event === 'payment.failed') { o.status = 'failed'; }
      saveOrders();
      console.log(`[gembapay] ${payment.orderId} -> ${o.status}`);
    }
    res.json({ received: true });
  });

  // frontend polls this
  app.get('/api/payment-status/:orderId', (req, res) => {
    const o = orders[req.params.orderId];
    if (!o) return res.status(404).json({ error: 'not found' });
    res.json({ orderId: o.orderId, status: o.status, amount: o.amount, currency: o.currency, paidAt: o.paidAt || null });
  });

  // owner-only: change the creation fee (wallet-signature gated)
  app.post('/api/admin/set-fee', (req, res) => {
    if (!ethers) return res.status(500).json({ error: 'signature verification unavailable' });
    const { amountEur, message, signature } = req.body || {};
    const amt = Number(amountEur);
    if (!(amt >= 0) || !message || !signature) return res.status(400).json({ error: 'bad request' });
    if (!OWNER) return res.status(500).json({ error: 'owner not configured' });
    let signer;
    try { signer = ethers.verifyMessage(message, signature).toLowerCase(); } catch { return res.status(400).json({ error: 'bad signature' }); }
    if (signer !== OWNER) return res.status(403).json({ error: 'not the owner' });
    if (!message.includes(String(amt))) return res.status(400).json({ error: 'amount/message mismatch' });
    fee = { amountEur: amt, currency: fee.currency };
    saveFee();
    console.log(`[gembapay] fee set to ${amt} ${fee.currency} by owner`);
    res.json({ ok: true, amountEur: amt, currency: fee.currency });
  });

  console.log(`[gembapay] ${appName}: fee ${fee.amountEur} ${fee.currency}; merchant ${API_KEY ? 'configured' : 'NOT configured'}; owner ${OWNER || 'unset'}`);
};

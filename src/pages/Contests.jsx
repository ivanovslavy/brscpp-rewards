import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Contract, parseUnits } from 'ethers';
import toast from 'react-hot-toast';
import { CONTEST_ABI, NETWORK_CONFIG } from '../contracts/hardhat-config';

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function symbol() view returns (string)',
];
const eqAddr = (a, b) => a && b && a.toLowerCase() === b.toLowerCase();
const shortAddr = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '—');

function TxLink({ hash, label }) {
  return (
    <span>{label}{' '}
      <a href={`${NETWORK_CONFIG.blockExplorer}/tx/${hash}`} target="_blank" rel="noopener noreferrer"
        style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>GembaScan</a>
    </span>
  );
}

const PHASE_STYLE = {
  setup: { color: '#2563EB', borderColor: 'rgba(37,99,235,0.3)', background: 'rgba(37,99,235,0.08)' },
  claiming: { color: '#16A34A', borderColor: 'rgba(22,163,74,0.3)', background: 'rgba(22,163,74,0.08)' },
  ended: { color: 'var(--text-tertiary)' },
};

export default function Contests({ factory }) {
  const { t } = useTranslation();
  const { contests, loading, isConnected, address, signer } = factory;
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('all');

  const mine = address
    ? contests.filter((c) => eqAddr(c.creator, address) || c.positions.some((p) => eqAddr(p.winner, address)))
    : [];
  const list = tab === 'mine' ? mine : contests;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6 animate-fade-up">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{t('contests.title')}</h1>
        {isConnected && (
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
            {['all', 'mine'].map((tb) => (
              <button key={tb} onClick={() => setTab(tb)} className="px-3 py-1.5 rounded-md text-sm cursor-pointer"
                style={{ background: tab === tb ? 'var(--card-bg)' : 'transparent', color: tab === tb ? 'var(--text-primary)' : 'var(--text-secondary)', border: 'none', fontWeight: 500 }}>
                {t(`contests.tab.${tb}`)}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && contests.length === 0 ? (
        <Empty text={t('contests.loading')} />
      ) : list.length === 0 ? (
        <Empty text={t(tab === 'mine' ? 'contests.emptyMine' : 'contests.empty')} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4 animate-fade-up delay-100">
          {list.map((c) => <ContestCard key={c.address} c={c} t={t} onOpen={() => setSelected(c)} />)}
        </div>
      )}

      {selected && (
        <ContestModal c={selected} address={address} signer={signer} t={t}
          onClose={() => setSelected(null)} onDone={() => { factory.reload(); setSelected(null); }} />
      )}
    </div>
  );
}

function ContestCard({ c, t, onOpen }) {
  const total = c.positions.reduce((s, p) => s + parseFloat(p.amount || '0'), 0);
  const sym = c.token?.symbol || (c.isNativeToken ? 'GMB' : 'ERC-20');
  return (
    <button onClick={onOpen} className="card text-left cursor-pointer hover:shadow-md transition-shadow" style={{ display: 'block', width: '100%' }}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-base" style={{ fontFamily: 'var(--font-display)' }}>{c.name}</h3>
        <span className="status-pill" style={PHASE_STYLE[c.phase]}>{t(`contests.phase.${c.phase}`)}</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
        <Stat label={t('contests.positions')} value={c.positionCount} />
        <Stat label={t('contests.prizePool')} value={`${total} ${sym}`} />
        <Stat label={t('contests.funded')} value={c.funded ? '✓' : '—'} />
      </div>
      <div className="mt-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
        {t('contests.by')} {shortAddr(c.creator)} · {t('contests.deadline')} {new Date(c.deadline * 1000).toLocaleDateString()}
      </div>
    </button>
  );
}

function ContestModal({ c, address, signer, t, onClose, onDone }) {
  const [busy, setBusy] = useState('');
  const [amounts, setAmounts] = useState(Array(c.positionCount).fill(''));
  const [winners, setWinners] = useState(Array(c.positionCount).fill(''));

  const isOwner = eqAddr(c.creator, address);
  const contestW = signer ? new Contract(c.address, CONTEST_ABI, signer) : null;
  const sym = c.token?.symbol || 'tokens';

  const run = async (key, fn) => {
    if (!contestW) return toast.error(t('contests.connectFirst'));
    setBusy(key);
    const tid = toast.loading(t('common.submitting'));
    try {
      const tx = await fn();
      toast.loading(t('common.confirming'), { id: tid });
      await tx.wait();
      toast.success(<TxLink hash={tx.hash} label={t('common.done')} />, { id: tid, duration: 8000 });
      onDone();
    } catch (err) {
      toast.error(err?.shortMessage || err?.reason || t('common.failed'), { id: tid });
      setBusy('');
    }
  };

  const onDeposit = async () => {
    const wei = amounts.map((a) => { try { return parseUnits(String(a || '0'), c.token.decimals); } catch { return -1n; } });
    if (wei.some((w) => w <= 0n)) return toast.error(t('contests.amountsInvalid'));
    const total = wei.reduce((s, w) => s + w, 0n);
    if (c.isNativeToken) {
      run('deposit', () => contestW.depositFunds(wei, { value: total }));
    } else {
      // ERC-20: approve then deposit
      setBusy('deposit');
      const tid = toast.loading(t('contests.approving'));
      try {
        const token = new Contract(c.tokenAddress, ERC20_ABI, signer);
        const allow = await token.allowance(address, c.address);
        if (allow < total) { const atx = await token.approve(c.address, total); await atx.wait(); }
        toast.loading(t('common.submitting'), { id: tid });
        const tx = await contestW.depositFunds(wei, { value: 0 });
        toast.loading(t('common.confirming'), { id: tid });
        await tx.wait();
        toast.success(<TxLink hash={tx.hash} label={t('common.done')} />, { id: tid, duration: 8000 });
        onDone();
      } catch (err) {
        toast.error(err?.shortMessage || err?.reason || t('common.failed'), { id: tid });
        setBusy('');
      }
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
      <div className="modal-panel card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560, width: '100%', maxHeight: '88vh', overflowY: 'auto' }}>
        <div className="flex items-start justify-between gap-3 mb-1">
          <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{c.name}</h2>
          <button onClick={onClose} className="cursor-pointer" style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>
        <div className="flex items-center gap-2 mb-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <span className="status-pill" style={PHASE_STYLE[c.phase]}>{t(`contests.phase.${c.phase}`)}</span>
          <a href={`${NETWORK_CONFIG.blockExplorer}/address/${c.address}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }}>{shortAddr(c.address)}</a>
          <span>· {c.token?.symbol || 'GMB'}{!c.isNativeToken ? ` (${shortAddr(c.tokenAddress)})` : ''}</span>
        </div>

        {/* positions */}
        <div className="space-y-2">
          {c.positions.map((p, i) => {
            const isWinner = eqAddr(p.winner, address);
            const canClaim = isWinner && !p.claimed && c.phase === 'claiming';
            const canWithdraw = isOwner && !p.claimed && c.phase === 'ended' && parseFloat(p.amount) > 0;
            return (
              <div key={i} className="rounded-lg p-3" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">#{i} · {p.amount} {c.token?.symbol || ''}</span>
                  {p.claimed ? <span className="status-pill" style={{ color: 'var(--text-tertiary)' }}>{t('contests.claimed')}</span>
                    : p.winner !== '0x0000000000000000000000000000000000000000'
                      ? <span className="text-xs" style={{ color: isWinner ? '#16A34A' : 'var(--text-secondary)' }}>{t('contests.winner')}: {shortAddr(p.winner)}</span>
                      : <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{t('contests.noWinner')}</span>}
                </div>

                {/* owner sets a winner (funded, before deadline, no winner yet) */}
                {isOwner && c.funded && c.phase === 'setup' && p.winner === '0x0000000000000000000000000000000000000000' && (
                  <div className="flex gap-2 mt-2">
                    <input className="form-input" style={{ fontSize: 13 }} placeholder="0x… winner" value={winners[i]}
                      onChange={(e) => setWinners((w) => w.map((x, j) => (j === i ? e.target.value : x)))} spellCheck={false} />
                    <button className="btn-flat primary" style={{ whiteSpace: 'nowrap' }} disabled={busy === `w${i}`}
                      onClick={() => { if (!/^0x[a-fA-F0-9]{40}$/.test(winners[i].trim())) return toast.error(t('contests.addrInvalid')); run(`w${i}`, () => contestW.setWinner(i, winners[i].trim())); }}>
                      {t('contests.setWinner')}
                    </button>
                  </div>
                )}
                {canClaim && (
                  <button className="btn-flat primary w-full justify-center mt-2" disabled={busy === `c${i}`} onClick={() => run(`c${i}`, () => contestW.claimBounty(i))}>
                    {t('contests.claim')}
                  </button>
                )}
                {canWithdraw && (
                  <button className="btn-outline w-full justify-center mt-2" disabled={busy === `x${i}`} onClick={() => run(`x${i}`, () => contestW.withdrawUnclaimed(i, address))}>
                    {t('contests.withdraw')}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* owner funds the contest */}
        {isOwner && !c.funded && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
            <h3 className="text-sm font-semibold mb-2">{t('contests.fundTitle')}</h3>
            <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>{t('contests.fundHint', { sym })}</p>
            <div className="space-y-2">
              {amounts.map((a, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs w-8" style={{ color: 'var(--text-secondary)' }}>#{i}</span>
                  <input className="form-input" type="number" min={0} step="0.0001" value={a} placeholder="0.0"
                    onChange={(e) => setAmounts((arr) => arr.map((x, j) => (j === i ? e.target.value : x)))} />
                </div>
              ))}
            </div>
            <button className="btn-flat primary w-full justify-center mt-3" disabled={busy === 'deposit'} onClick={onDeposit}>
              {busy === 'deposit' ? '…' : t('contests.fundCta')}
            </button>
          </div>
        )}

        {!isConnectedHint(address) && <p className="text-xs text-center mt-4" style={{ color: 'var(--text-tertiary)' }}>{t('contests.connectToAct')}</p>}
      </div>
    </div>
  );
}

function isConnectedHint(address) { return !!address; }
function Stat({ label, value }) {
  return (
    <div>
      <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</div>
      <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{label}</div>
    </div>
  );
}
function Empty({ text }) {
  return <div className="text-center py-20 text-sm animate-fade-up" style={{ color: 'var(--text-tertiary)' }}>{text}</div>;
}

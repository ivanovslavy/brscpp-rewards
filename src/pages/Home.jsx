import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';

export default function Home({ factory }) {
  const { t } = useTranslation();
  const { lang } = useParams();
  const { isConnected, stats } = factory;

  if (!isConnected) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 sm:py-20 text-center">
        <h1 className="text-3xl sm:text-5xl font-bold mb-4 animate-fade-up" style={{ fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>
          {t('home.title')}
        </h1>
        <p className="text-base sm:text-lg mb-8 animate-fade-up delay-100" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          {t('home.subtitle')}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 animate-fade-up delay-200">
          <Link to={`/${lang}/create`} className="btn-flat primary no-underline">{t('home.ctaCreate')}</Link>
          <Link to={`/${lang}/contests`} className="btn-outline no-underline">{t('home.ctaBrowse')}</Link>
        </div>
        <p className="text-sm mt-8 animate-fade-up delay-200" style={{ color: 'var(--text-tertiary)' }}>{t('home.getStarted')}</p>

        <div className="grid sm:grid-cols-3 gap-4 mt-14 text-left animate-fade-up delay-200">
          {['permissionless', 'positions', 'trustless'].map((k) => (
            <div key={k} className="card">
              <h3 className="font-semibold mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>{t(`home.features.${k}.title`)}</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{t(`home.features.${k}.body`)}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>{t('home.loading')}</div>;
  }

  const statCards = [
    { k: 'total', v: stats.totalContracts },
    { k: 'active', v: stats.activeContracts },
    { k: 'completed', v: stats.completedContracts },
    { k: 'tvl', v: `${parseFloat(stats.totalValueLocked).toFixed(2)} GMB` },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8 animate-fade-up">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{t('home.titleIn')}</h1>
        <div className="flex gap-2">
          <Link to={`/${lang}/create`} className="btn-flat primary no-underline">{t('home.ctaCreate')}</Link>
          <Link to={`/${lang}/contests`} className="btn-outline no-underline">{t('home.ctaBrowse')}</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10 animate-fade-up delay-100">
        {statCards.map((s) => (
          <div key={s.k} className="text-center py-5 px-3 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{s.v}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{t(`home.stats.${s.k}`)}</div>
          </div>
        ))}
      </div>

      <div className="card animate-fade-up delay-200">
        <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-display)' }}>{t('home.system.title')}</h2>
        <div className="space-y-3 text-sm">
          <Row label={t('home.system.status')} value={
            <span className="status-pill" style={stats.isPaused ? { color: '#DC2626', borderColor: 'rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.08)' } : {}}>
              {stats.isPaused ? t('home.system.paused') : t('home.system.active')}
            </span>
          } />
          <Row label={t('home.system.deployFee')} value={`${stats.deployFee} GMB`} />
          <Row label={t('home.system.tvl')} value={`${parseFloat(stats.totalValueLocked).toFixed(4)} GMB`} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

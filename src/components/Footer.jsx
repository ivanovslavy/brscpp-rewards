import { useTranslation } from 'react-i18next';
import GembaLogo from './GembaLogo';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer style={{ borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <GembaLogo size={24} />
          <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            {t('brand.name')}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>— {t('footer.by')}</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="https://gembait.com" className="text-xs no-underline" style={{ color: 'var(--text-tertiary)' }}>gembait.com ↗</a>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>© 2026 GEMBA IT — {t('footer.rights')}</span>
        </div>
      </div>
    </footer>
  );
}

import { useTranslation } from 'react-i18next';
import { LEGAL, LEGAL_UPDATED } from '../lib/legal';

// Renders the Terms of Service or the Privacy Policy in the active language.
export default function Legal({ kind }) {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').slice(0, 2);
  const L = LEGAL[lang] || LEGAL.en;
  const sections = kind === 'privacy' ? L.privacy : L.terms;
  const title = kind === 'privacy' ? L.privacyTitle : L.termsTitle;
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:py-12 animate-fade-up">
      <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>{title}</h1>
      <p className="text-xs mt-1 mb-3" style={{ color: 'var(--text-tertiary)' }}>{L.updatedLabel}: {LEGAL_UPDATED}</p>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)', lineHeight: 1.65 }}>{L.intro}</p>
      <div className="space-y-5">
        {sections.map((s, i) => (
          <section key={i}>
            <h2 className="text-base font-semibold mb-1.5" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{s.h}</h2>
            {s.p.map((para, j) => (
              <p key={j} className="text-sm mb-2" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{para}</p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
